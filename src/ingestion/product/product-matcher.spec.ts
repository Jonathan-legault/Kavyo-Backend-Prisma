import { describe, expect, it } from 'vitest';
import { matchProduct, type ExistingProductIdentity } from './product-matcher.js';

const product = (patch: Partial<ExistingProductIdentity> = {}): ExistingProductIdentity => ({
  id:'product-1', productName:'Acme Rice', brand:'Acme', barcode:null,
  quantityValue:500, quantityUnit:'g', quantityText:'500 g', ...patch,
});
const candidate = {productName:'Acme Rice',brand:'Acme',barcode:null,quantityValue:0.5,quantityUnit:'kg'};

describe('matchProduct',()=>{
  it('finds exact brand/name/quantity using unit conversions',()=>{
    expect(matchProduct(candidate,[product()])).toMatchObject({status:'MATCH_EXISTING',productId:'product-1',matchMethod:'EXACT_IDENTITY'});
  });
  it('reports candidate without any existing match',()=>{
    expect(matchProduct(candidate,[]).status).toBe('CREATE_CANDIDATE');
  });
  it('does not match different package sizes',()=>{
    expect(matchProduct(candidate,[product({quantityValue:1,quantityUnit:'kg'})]).status).toBe('CREATE_CANDIDATE');
  });
  it('does not match a different brand',()=>{
    expect(matchProduct(candidate,[product({brand:'Other'})]).status).toBe('CREATE_CANDIDATE');
  });
  it('flags duplicate exact matches',()=>{
    expect(matchProduct(candidate,[product(),product({id:'product-2'})]).reasons).toContain('MULTIPLE_EXACT_IDENTITY_MATCHES');
  });
  it('rejects records without product name',()=>{
    expect(matchProduct({productName:'',brand:'Acme',quantityText:'500 g'},[]).status).toBe('REJECT');
  });
  it('holds grouped variants for review',()=>{
    expect(matchProduct({...candidate,isMultiVariant:true},[]).status).toBe('REVIEW');
  });
  it('holds ranges for review',()=>{
    expect(matchProduct({...candidate,isPriceRange:true},[]).status).toBe('REVIEW');
  });
  it('does not trust a malformed barcode',()=>{
    expect(matchProduct({...candidate,barcode:'SKU123'},[]).status).toBe('REVIEW');
  });
  it('matches a verified GTIN',()=>{
    const c = {...candidate,barcode:'036000291452'};
    expect(matchProduct(c,[product({barcode:'036000291452'})])).toMatchObject({status:'MATCH_EXISTING',matchMethod:'VERIFIED_GTIN'});
  });
  it('holds a verified GTIN with conflicting size',()=>{
    const c = {...candidate,barcode:'036000291452'};
    expect(matchProduct(c,[product({barcode:'036000291452',quantityValue:1,quantityUnit:'kg'})]).reasons).toContain('GTIN_PACKAGE_CONFLICT');
  });
  it('holds same identity but different verified GTINs',()=>{
    const c = {...candidate,barcode:'036000291452'};
    expect(matchProduct(c,[product({barcode:'012345678905'})]).reasons).toContain('CONFLICTING_GTIN');
  });
  it('does not infer multipacks from quantity text',()=>{
    expect(matchProduct({productName:'Acme Rice',brand:'Acme',quantityText:'2 x 500 g'},[]).status).toBe('REVIEW');
  });
});
