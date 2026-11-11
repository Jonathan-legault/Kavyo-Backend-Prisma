import {describe,expect,it} from 'vitest';
import {planProductMatches,summarizeProductDryRun,type StagedProductInput} from './product-dry-run.js';

const row = (id:string,patch:Partial<StagedProductInput>={}): StagedProductInput => ({
  id,retailerName:'Safeway',sourceRecordId:id,status:'NORMALIZED',productName:'Acme Rice',brand:'Acme',
  descriptionText:'Rice',packageSizeText:'500 g',quantityValue:500,quantityUnit:'g',
  quantityIsApproximate:false,isMultiVariant:false,isPriceRange:false,...patch,
});
const product = {id:'p1',productName:'Acme Rice',brand:'Acme',barcode:null,quantityValue:0.5,quantityUnit:'kg',quantityText:'500 g'};
describe('product matching dry-run',()=>{
  it('does not try to insert existing identical product',()=>{
    expect(planProductMatches([row('s1')],[product])[0]).toMatchObject({decision:'MATCH_EXISTING',productId:'p1'});
  });
  it('deduplicates multiple retailer candidate rows without inserting',()=>{
    const rows=planProductMatches([row('s1'),row('s2',{retailerName:'Walmart',quantityValue:0.5,quantityUnit:'kg'})],[]);
    expect(rows.map(r=>r.decision)).toEqual(['CREATE_CANDIDATE','CREATE_CANDIDATE']);
    expect(summarizeProductDryRun(rows)).toMatchObject({distinctCreateCandidateGroups:1,duplicateCandidateRows:1});
  });
  it('reviews missing brand when no GTIN exists',()=>{
    expect(planProductMatches([row('s1',{brand:null})],[])[0].decision).toBe('REVIEW');
  });
  it('reviews grouped variants even when in scope',()=>{
    expect(planProductMatches([row('s1',{isMultiVariant:true})],[])[0].decision).toBe('REVIEW');
  });
  it('does not treat missing price as missing product identity',()=>{
    expect(planProductMatches([row('s1',{status:'PENDING_REVIEW'})],[])[0].decision).toBe('CREATE_CANDIDATE');
  });
  it('does not match non-grocery goods',()=>{
    expect(planProductMatches([row('s1',{productName:'Bluetooth headphones',descriptionText:'wireless audio'})],[])[0].decision).toBe('OUT_OF_SCOPE');
  });
  it('retains uncertain scope for review',()=>{
    expect(planProductMatches([row('s1',{productName:'Mystery ZXC',descriptionText:null})],[])[0].decision).toBe('REVIEW');
  });
  it('will not infer multipacks',()=>{
    expect(planProductMatches([row('s1',{quantityValue:null,quantityUnit:null,packageSizeText:'2 x 500 g'})],[])[0].decision).toBe('REVIEW');
  });
});
