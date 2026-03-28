import {Component, EventEmitter, Injectable} from '@angular/core';
import {DataServiceService} from './services/data-service.service';

export default class Special {
  availableTimes;
  products;
  productsUpdated = new EventEmitter();
  types;
  id;
  name;

  constructor(private json: any = null, private dataService: DataServiceService) {
    const { products, timeslots, id, name } = json;
    this.products = products;
    this.id = id;
    this.name = name;
    this.availableTimes = timeslots;
  }


  async sortBySpecial(products) {
    this.types = await this.dataService.getProductTypes().toPromise();
    const specialTypeId = this.types.find(element => element.name === 'Special');
    return products.sort((a, b) => {
      if (a.typeId === specialTypeId.id) {
        return -1;
      }
      return 1;
    });
  }
  getAvailableTimes() {
    return this.availableTimes;
  }
  getAvailableTimesCount() {
    if(!this.availableTimes) { return 0; }
    return Object.keys(this.availableTimes).length;
  }
  async formatMenu() {
    const t = this.initializeSelectedSizes(this.products);
    this.products = await this.sortBySpecial(t);
  }
  initializeSelectedSizes(menu) {
    menu.forEach((item) => {
      if (item.product_sizes && item.product_sizes.length > 0) {
        item.product_size_selected = item.product_sizes[0];
      }
      // Transform product_selection_values from array to object with selected property
      if (item.product_selection_values) {
        Object.keys(item.product_selection_values).forEach(selectionKey => {
          const selectionData = item.product_selection_values[selectionKey];
          if (selectionData) {
            Object.keys(selectionData).forEach(sizeKey => {
              const sizeData = selectionData[sizeKey];
              // If it's an array, transform it to an object with the array and selected property
              if (Array.isArray(sizeData)) {
                selectionData[sizeKey] = {
                  options: sizeData,
                  selected: null
                };
              } else if (sizeData && !sizeData.hasOwnProperty('selected')) {
                // If it's already an object but doesn't have selected, add it
                if (sizeData.options) {
                  sizeData.selected = sizeData.selected || null;
                } else {
                  // Convert single object to structure with options array
                  selectionData[sizeKey] = {
                    options: [sizeData],
                    selected: null
                  };
                }
              }
            });
          }
        });
      }
    });
    return menu;
  }
  setProducts(p) {
    this.products = p;
  }

  getProducts() {
    return this.products;
  }
  findMatchingProduct(p) {
    return this.products.find(product => product.id === p);
  }

  updateProductQuantity(itemId, increment) {
    const p = this.findMatchingProduct(itemId);
    if (p.quantity === -1) {
      return;
    }
    p.quantity -= increment;
    this.productsUpdated.emit(this.products);

  }
}
