import {describe,it,expect} from 'vitest';
import {interpretOfferPricing} from './offer-pricing-basis.js';
describe('B5 price vs comparison price',()=>{
 it('fixed 500g package: customer pays $7.99; 100g price is only comparison',()=>{
  expect(interpretOfferPricing({advertisedPrice:7.99,priceQualifier:'each',packageWeightGrams:500})).toMatchObject({sellingBasis:'FIXED_PACKAGE',advertisedPrice:7.99,comparisonPricePer100g:1.60,priceNeedsReview:false});
 });
 it('deli ham sold at $3.99/100g: do not invent a checkout total',()=>{
  expect(interpretOfferPricing({advertisedPrice:3.99,priceQualifier:'$3.99/100 g',packageWeightGrams:null})).toMatchObject({sellingBasis:'WEIGHT_BASED',sellingUnit:'100 g',comparisonPricePer100g:null});
 });
 it('uncertain pear selling unit: no guessed price per kg or each',()=>{
  expect(interpretOfferPricing({advertisedPrice:1.99,priceQualifier:null,promotionText:'MEMBERS EARN 10%'})).toMatchObject({sellingBasis:'UNKNOWN',priceNeedsReview:true,customerComment:'MEMBERS EARN 10%'});
 });
 it('points do not discount purchase price',()=>{
  expect(interpretOfferPricing({advertisedPrice:2,priceQualifier:'each',packageWeightGrams:375,promotionText:'50 Scene+ PTS when you buy 2'})).toMatchObject({advertisedPrice:2,comparisonPricePer100g:0.53,customerComment:'50 Scene+ PTS when you buy 2'});
 });
 it('fixed $7.99 promotion for a 100–200g range does not invent a unit price',()=>{
  expect(interpretOfferPricing({advertisedPrice:7.99,priceQualifier:'each',packageWeightGrams:null})).toMatchObject({sellingBasis:'FIXED_PACKAGE',comparisonPricePer100g:null});
 });
 it('zero/garbled weight never produces a normalized price',()=>{
  expect(interpretOfferPricing({advertisedPrice:7.99,priceQualifier:'each',packageWeightGrams:0}).comparisonPricePer100g).toBeNull();
 });
});
