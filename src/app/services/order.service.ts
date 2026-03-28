import {Injectable, EventEmitter, SimpleChanges} from '@angular/core';
import {Storage} from '@ionic/storage';
import { ProductsService } from '../products.service';
import { SpecialsProductsService } from '../specials-products.service';
import { DataServiceService } from './data-service.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  order = {items: [], total: 0, subtotal: 0, pickupTime: new Date()};
  specialsId = null;
  specialLoading = true;
  menuLoading = true;
  orderUpdated = new EventEmitter();
  types;

  constructor(private storage: Storage,
              private specialsProductsService: SpecialsProductsService,
              private dataService: DataServiceService,
              private productsService: ProductsService) {
    this.init().then(() => {
    });
  }
  async init() {
    // 2. Menu
    const productResults = await this.dataService.getActiveMenu().toPromise();
    this.setMenuLoading(false);
    console.log("PR ", productResults )

    const availableItems = this.formatMenu(productResults);
    await this.productsService.setProducts(availableItems);

    // 3. Order timeslots
    await this.loadRegularTimes();
  }
  async ngOnInit() {
  }
  formatMenu(menu) {
    return this.initializeSelectedSizes(menu);
  }
  sortBySpecial(products) {
    const specialTypeId = this.types.find(element => element.name === 'Special');
    return products.sort((a, b) => {
      if (a.typeId === specialTypeId.id) {
        return -1;
      }
      return 1;
    });
  }
  initializeSelectedSizes(menu) {
    menu.forEach((item) => {
      if (item.product_sizes && item.product_sizes.length > 0) {
        item.product_size_selected = item.product_sizes[0];
      }
    });
    return menu;
  }
  ngOnChanges(changes: SimpleChanges) {
  }

  checkForSelectionCount(item) {
    return Object.keys(item.product_selection_values).some(key => {
      const sizeKey = item.product_size_selected && item.product_size_selected.size ? item.product_size_selected.size : "size";
      console.log(sizeKey)
      return !item.product_selection_values[key][sizeKey].selected;
    });
  }
  activeSpecial() {
    return this.specialsId;
  }

  menuContainsAllProducts() {
    try {

    if(!this.order) { return true; }
    if(!this.productsService.types) { return true;}
    if(!this.productsService.products) { return true; }
    const specialTypeId = this.productsService.types.find(element => element.name === 'Special');
    const productIdsInCart = this.order.items.map(v => v.productId);
    const specialIds = this.productsService.products.filter(v => v.typeId != specialTypeId.id).map(v=>v.id);
    return !productIdsInCart.every(elem => specialIds.includes(elem));
    } catch(err) {
      return true;
    }
  }
  specialContainsAllProducts(special) {
    try {
      if(!this.order) { return true; }
      const productIdsInCart = this.order.items.map(v => v.productId);
      const specialIds = special.products.map(v => v.id);
      return !productIdsInCart.every(elem => specialIds.includes(elem));
    } catch(err) {
      return true;
    }
  }

  getSpecialId() {
    return this.specialsId;
  }

  getSpecialProducts() {
    const specialProductIds = this.specialsProductsService.specials[0].getProducts().map(p => p.id);
    return this.productsService.products.filter(p => specialProductIds.includes(p.id));
  }

  async updateCart(item, increment) {
    const match = this.productsService.findMatchingProduct(item.productId);
    const q = match.quantity;
    if(q === 0 && increment > 0) {
      return 'Whoops we don\'t have that many left, we\'ve updated your cart';
    }
    const index = this.order.items.findIndex(cartItem => {
      const cloneCartItem = JSON.parse(JSON.stringify(cartItem));
      const cloneNewItem = JSON.parse(JSON.stringify(item));
      return JSON.stringify(cloneNewItem) === JSON.stringify(cloneCartItem);
    });
    const matchingItem = this.order.items[index];
    this.productsService.updateProductQuantity(matchingItem.productId, increment);
    if (matchingItem.quantity + increment === 0) {
      this.order.items.splice(index, 1);
      return;
    }
    matchingItem.quantity += increment;
  }

  getPickupTime() {
    return this.order.pickupTime;
  }
  setPickupTime(time) {
    this.order.pickupTime = time;
  }

 async getTimesForCart() {
    /*
       if an item belongs to a special in the cart we only return that
       specials times

       if the cart has no special items, return all specials/times with that item
     */
   const specialTypeId = this.productsService.types.find(element => element.name === 'Special');

   /* Check for any special items in the cart */
   const specialProductsInCart = this.order.items.filter(item => item.typeId === specialTypeId.id);
   let specialsBeingBought = [];
   specialProductsInCart.forEach(product => {
     specialsBeingBought = this.specialsProductsService.getSpecialIdsContainingProductId(product.productId);
   });
   const specialsTimes = this.specialsProductsService.getTimesForSpecials(specialsBeingBought);
   if(Object.keys(specialsTimes).length > 0) {
     return specialsTimes;
   }
   /* at this point the cart contains no special items */

   const times = {};
   // if every item in the cart belongs to a special, add its times
   const productIdsInCart = this.order.items.map(v => v.productId);
   const specials = await this.specialsProductsService.getSpecials();
   specials.forEach(special => {
     const specialIds = special.products.map(v => v.id);
     if(productIdsInCart.every(elem => specialIds.includes(elem))) {
       Object.keys(special.availableTimes).forEach(key => {
         times[key] = special.availableTimes[key];
       });
     }
   });
   Object.keys(this.productsService.availableTimes).forEach(key => {
     times[key] =this.productsService.availableTimes[key];
   });
   return times;
 }

  async loadRegularTimes() {
    await this.productsService.loadAvailableTimes();
  }

  async addToCart(newItem) {
    if (newItem.quantity === 0) {
      // await this.presentAlertMessage("Whoops we don't have that many left, we've updated your cart");
      return 'Whoops we don\'t have that many left, we\'ve updated your cart';
    }
    if (this.checkForSelectionCount(newItem)) {
      return 'Please make a selection';
    }
    newItem.quantity--;
    const item = this.formatCartItem(newItem);

    this.addItem(item);
  }

  getItemCost(item) {
    if (item.product_size_selected && item.product_size_selected.cost != null) {
      return item.product_size_selected.cost;
    } else if (item.price != null) {
      return item.price;
    } else {
      return 0;
    }
  }

  formatSize(item) {
    if (!item.product_size_selected) {
      return null;
    }
    const id = item.product_size_selected.id;
    // item.product_size_selected = item.product_sizes[0];
    return id;
  }

  formatCartItem(item) {
    const formatted = {
      price: this.getItemCost(item),
      productId: item.id,
      product_name: item.title,
      quantity: 1,
      product_size_id: this.formatSize(item),
      selections: this.formatSelections(item),
      add_ons: this.formatAddOns(item),
      typeId: item.typeId
    };
    item.product_size_selected = item.product_sizes[0];
    return formatted;
  }

  formatAddOns(item) {
    const size = item.product_size_selected?.size || "size";
    let vals = {};
    console.log("ADD ONS ", item.product_add_on_values)
    console.log("SIZE ", size);
    Object.keys(item.product_add_on_values).forEach(key => {
      console.log(item.product_add_on_values[key][size].selected);
      console.log(item.product_add_on_values[key][size]?.selected?.length);
      if (item.product_add_on_values[key][size].selected &&
        item.product_add_on_values[key][size].selected.length > 0) {
        const arr = item.product_add_on_values[key][size].selected;
        console.log(arr);
        vals[key] = arr.map(val => {
          return {
            value: val.value,
            cost: val.cost
          }
        });
        item.product_add_on_values[key].selected = null;
      }
    });
    return vals;
  }

  formatSelections(item) {
    console.log('IN ', item);
    const size = item.product_size_selected?.size || "size";
    const vals = {};
    console.log(' SEL ', item.product_selection_values);
    Object.keys(item.product_selection_values).forEach(key => {
      if (item.product_selection_values[key][size].selected) {
        vals[key] = {
          value: item.product_selection_values[key][size].selected.value,
          cost: item.product_selection_values[key][size].selected.cost
        };
        item.product_selection_values[key][size].selected = null;
      }
    });
    return vals;
  }

  addItem(item) {
    let foundIdentical = false;
    this.order.items.forEach(i => {
      const oldQuantity = i.quantity;
      i.quantity = 1;
      if (JSON.stringify(i) == JSON.stringify(item)) {
        i.quantity = oldQuantity + 1;
        foundIdentical = true;
        return;
      } else {
        i.quantity = oldQuantity;
      }
    });
    if (foundIdentical) {
      this.setSpecialId(this.specialsId);
      return;
    }
    this.order.items.push(item);
    this.setSpecialId(this.specialsId);
  }

  setSpecialId(id) {
    this.specialsId = id;
    this.orderUpdated.emit({order: this.order, specialsId: this.specialsId});
  }

  setMenuLoading(x) {
    this.menuLoading = x;
    this.orderUpdated.emit({loading: this.menuLoading});
  }
  setLoading(x) {
    this.specialLoading = x;
    this.orderUpdated.emit({loading: this.specialLoading});
  }
  setOrder(x) {
    this.order = x;
    this.orderUpdated.emit({order: this.order, specialsId: this.specialsId});
  }

  getOrder() {
    return this.order;
  }
}
