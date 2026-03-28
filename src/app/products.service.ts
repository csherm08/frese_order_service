import {EventEmitter, Injectable} from '@angular/core';
import {DataServiceService} from './services/data-service.service';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

  products;
  types;
  productsUpdated = new EventEmitter();
  availableTimes;

  constructor(private dataService: DataServiceService) {
  }
  getAvailableTimesCount() {
    if(!this.availableTimes) { return 0; }
    return Object.keys(this.availableTimes).length;
  }

  async setProducts(p) {
    this.types = await this.dataService.getProductTypes().toPromise();
    console.log(p);
    this.products = p;
  }
  async loadAvailableTimes() {
    this.availableTimes = await this.dataService.getAvailableTimeSlots().toPromise();
    Object.keys(this.availableTimes).forEach(k => {
      if(!this.availableTimes[k].active) {
        delete this.availableTimes[k];
      }
    });
  }
  getProducts() {
    const special = this.types.find(t => t.name === 'Special');
    const catering = this.types.find(t => t.name === 'Catering');
    const plugPower = this.types.find(t => t.name === 'Plug Power');
    // Filter out Special, Superbowl (typeId 10), Catering, Plug Power (second-location catalog)
    return this.products.filter(p => {
      if (special && p.typeId === special.id) return false;
      if (p.typeId === 10) return false; // Superbowl Special
      if (catering && p.typeId === catering.id) return false;
      if (plugPower && p.typeId === plugPower.id) return false;
      return true;
    });
  }

  findMatchingProduct(p) {
    return this.products.find(product => product.id === p);
  }

  updateProductQuantity(itemId, increment) {
    const p = this.findMatchingProduct(itemId);

    if(p.quantity === -1){ return; }
    p.quantity -= increment;
    this.productsUpdated.emit(this.products);
  }
}
