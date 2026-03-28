import { Component, OnInit } from '@angular/core';
import {PayNowPage} from '../pay-now/pay-now.page';
import {SpinnerService} from '../services/spinner.service';
import {DataServiceService} from '../services/data-service.service';
import {AlertController, ModalController} from '@ionic/angular';
import {OrderService} from '../services/order.service';
import { Storage } from '@ionic/storage';
import {ProductsService} from '../products.service';
import {SelectOrderTimePage} from '../select-order-time/select-order-time.page';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
})
export class CartPage implements OnInit {

  TAX_CONSTANT = .08;
  types;
  cart;
  products;
  specialProducts;
  specialsId;
  constructor(private spinnerService: SpinnerService,
              private modalController: ModalController,
              private alertController: AlertController,
              private storage: Storage,
              private productsService: ProductsService,
              public orderService: OrderService,
              private dataService: DataServiceService) { }

  getOrder() {
    // return JSON.stringify(this.order);
  }
  refreshPage() {
    window.location.reload();
  }
  async updateCart(item, increment) {
    const resp = await this.orderService.updateCart(item, increment);
    if(resp === 'Whoops we don\'t have that many left, we\'ve updated your cart') {
      await this.presentAlertMessage(resp);
    }

  }
  async ngOnInit() {
    this.types = this.productsService.types;
  }
  async presentAlertMessage(msg, func = null) {
    const binded = func && func.bind(this);
    const alert = await this.alertController.create({
      message: msg,
      buttons: [{
        text: 'Okay',
        cssClass: 'primary',
        role: 'cancel',
        handler: () => {
          binded && binded();
        }
      }
      ]
    });
    await alert.present();
  }
  deleteItem(index) {
    const item = this.cart.items[index];
    this.products.forEach(p => {
      if(p.id === item.productId) {
        p.quantity += item.quantity;
      }
    });
    this.cart.items.splice(index, 1);
  }
  getAddOnSizes(item, key) {
    return Object.keys(item.add_ons[key]);
  }

  displayAmount(amount) {
    if (amount == null || amount === undefined) {
      return '0.00';
    }
    return amount.toFixed(2);
  }

  getSelectionKeys(item) {
    return Object.keys(item.selections);
  }

  getAddOnKeys(item) {
    return Object.keys(item.add_ons);
  }

  getAddOnValues(item, key) {
    return item.add_ons[key];
  }

  displaySubtotal() {
    return this.getSubtotal().toFixed(2);
  }

  getSubtotal() {
    let total = 0;
    for (const item of this.cart.items) {
      let item_cost = item.price;
      Object.keys(item.selections).forEach(key => {
        if (item.selections[key].cost) {
          item_cost += item.selections[key].cost;
        }
      });
      Object.keys(item.add_ons).forEach(key => {
        for (const value of item.add_ons[key]) {
          if (value.cost) {
            item_cost += value.cost;
          }
        }
      });
      total += item_cost * item.quantity;
    }
    return this.round(total);
  }

  shouldBeTaxed(item) {
    const BreadType = this?.types?.find(element => element.name === 'Bread');
    const x = item.typeId !== BreadType?.id;
    return x;
  }
  getTax() {
    let total = 0;
    for (const item of this.orderService.getOrder().items) {
      let item_cost = item.price;
      Object.keys(item.selections).forEach(key => {
        if (item.selections[key].cost) {
          item_cost += item.selections[key].cost;
        }
      });
      Object.keys(item.add_ons).forEach(key => {
        for (const value of item.add_ons[key]) {
          if (value.cost) {
            item_cost += value.cost;
          }
        }
      });
      if(this.shouldBeTaxed(item)) {
        total += item_cost * item.quantity * this.TAX_CONSTANT;
      } else {
      }
    }
    return this.round(total);  }



  displayTotal() {
    return this.getTotal().toFixed(2);
  }

  getTotal() {
    const subtotal = this.getSubtotal();
    return this.round(subtotal + this.getTax());
  }

  round(value: number, digits = 2) {
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);
    return value;
  }

  closeModal() {
    this.modalController.dismiss({
      refresh: false
    });
  }

  async Pay() {
    if(this.cart.items.length === 0) {
      await this.presentAlertMessage('Oops! looks like your cart is empty.');
      return;
    }
    this.cart.total = this.getTotal();
    this.cart.subtotal = this.getSubtotal();
    //
    // const orderRes = await this.dataService.createOrder(this.cart).toPromise();
    // console.log('SENDING TO SUCCESS ', orderRes);
    // if (!orderRes.id) {
    //   await this.presentAlertMessage('Something went wrong creating your order, please try again');
    //   return;
    // }
    //
    const modal = await this.modalController.create({
      component: SelectOrderTimePage,
      componentProps: {
      }
    });
    modal.onDidDismiss().then(async (detail: any) => {
      this.spinnerService.hideSpinner();
      if (detail.data && detail.data.success) {
        await this.presentAlertMessage('Thank you for your order! We will email you a receipt.', this.refreshPage);
      }
    });
    await modal.present();
  }
}
