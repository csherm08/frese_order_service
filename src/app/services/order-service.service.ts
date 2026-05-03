import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderServiceService {
  apiUrl = environment.baseUrl;
  constructor(public http: HttpClient) { }

  getProductTypes() {
    return this.http.get(`${this.apiUrl}/products/types`);
  }
  getFullMenu() {
    return this.http.get(`${this.apiUrl}/productsAndSizes`);
  }
  getOrderById(id) {
    return this.http.get(`${this.apiUrl}/orders/${id}`);
  }
  getActiveMenu() {
    return this.http.get(`${this.apiUrl}/activeProductsAndSizesIncludingSpecials`);
  }
  applyCoupon(intent, orderId, coupon) {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/coupon/${coupon}/apply`, {intent});
  }
  createOrder(o) {
    o.status = 'pending';
    return this.http.post(`${this.apiUrl}/orders`, o);
  }
  createAndProcessOrder(order, paymentIntentInfo) {
    order.status = 'pending';
    const body = {
      order, paymentIntentInfo
    };
    return this.http.post(`${this.apiUrl}/processOrderAndPay`, body);
  }

  getActiveSpecial() {
    return this.http.get(`${this.apiUrl}/activeSpecial`);
  }
  getActiveSpecials() {
    return this.http.get(`${this.apiUrl}/activeSpecials?site=main`);
  }
  getSpecialById(id) {
    return this.http.get(`${this.apiUrl}/specials/${id}`);
  }

  unsubscribe(email) {
    return this.http.patch(`${this.apiUrl}/users`, {
      email
    });
  }
  updateOrderDetails(orderId, body) {
    return this.http.patch(`${this.apiUrl}/orders/${orderId}/updateOrderDetails`, body);
  }
  getAvailableTimeSlots() {
    return this.http.get(`${this.apiUrl}/orders/availableTimes/6?site=main`);
  }
  getAvailableSpecialSlots(id) {
    return this.http.get(`${this.apiUrl}/orders/availableSpecialTimes/${id}`);
  }
}
