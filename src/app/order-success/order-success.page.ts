import { Component, OnInit } from '@angular/core';
import dateFormat from 'dateformat';
import {ActivatedRoute} from '@angular/router';
import {DataServiceService} from '../services/data-service.service';
import {OrderService} from '../services/order.service';

@Component({
  selector: 'app-order-success',
  templateUrl: './order-success.page.html',
  styleUrls: ['./order-success.page.scss'],
})
export class OrderSuccessPage implements OnInit {
  order;
  constructor(private route: ActivatedRoute, private orderService: OrderService, private dataService: DataServiceService) { }

  async ngOnInit() {
    const routeParams = this.route.snapshot.paramMap;
    this.route.queryParams.subscribe(async params => {
      console.log(params);
    const orderId = parseInt(params.orderId, 10);
    if(orderId) {
      this.order = await this.dataService.getOrderById(orderId).toPromise();
    } else {
      this.order = this.orderService.getOrder();
    }
      console.log('ORDER ', this.order);
    this.order.items = this.formatOrderItems(this.order);
    });
  }

  getOrderItems() {
    if(this.order?.items.length) {
    return this.order.items;
    } else {
      return [];
    }
  }

  getTotal() {
    return this.order?.total;
  }
  refreshPage() {
    window.location.reload();
  }
  formatPickupTime(pickupTime) {
    const pt = new Date(pickupTime);
    if(this.isToday(pt)) {
      return dateFormat(pt, 'h:MM TT' );
    } else {
      return dateFormat(pt, 'mm/dd h:MM TT' );
    }
  }
  getSubTotal(): number {
    return this.order?.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getEstimatedTax(): number {
    return this.order?.total - this.getSubTotal();
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

  getSizeName(item) {
    const productSize = item.product.product_sizes.find(ps => ps.id === item.product_size_id);
    return productSize ? productSize.size: null;
  }
  getAddOnValues(item, key) {
    return item.add_ons[key];
  }

  displayTotal() {
    return this.getTotal().toFixed(2);
  }

  formatOrderItems(order) {
    const itemMap = {};
    console.log('LEN ', order.items.length);
    order.items.forEach(item => {
      let entry = JSON.parse(JSON.stringify(item));
      console.log('E ', entry);
      delete entry.created_at;
      delete entry.updated_at;
      delete entry.id;
      console.log('ITEM SEL ', item.selections);
      if (item.selections) {
        const parsed = JSON.parse(item.selections);
        entry.selections = [];
        for (const [k, _] of Object.entries(parsed)) {
          entry.selections.push(`${k}: ${parsed[k].value}`);
        }
      }
      if (item.add_ons) {
        const parsed = JSON.parse(item.add_ons);
        entry.add_ons = [];
        for (const [k, _] of Object.entries(parsed)) {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const add_on_res = parsed[k].map(item => item.value).join(', ');
          entry.add_ons.push(`${k}: ${add_on_res}`);
        }
      }
      if (item.product_size) {
        entry.product_size = item.product_size.size;
      }
      entry = JSON.stringify(entry);
      if (itemMap[entry]) {
        itemMap[entry] += 1;
      } else {
        itemMap[entry] = 1;
      }
    });


    return Object.keys(itemMap).map(val => {
      const p = JSON.parse(val);
      p.quantity = itemMap[val];
      return p;
    });
  }
  round(value: number, digits = 2) {
    value = value * Math.pow(10, digits);
    value = Math.round(value);
    value = value / Math.pow(10, digits);
    return value;
  }
  isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear();
  }
}
