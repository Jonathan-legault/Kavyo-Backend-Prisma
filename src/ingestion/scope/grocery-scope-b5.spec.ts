import { describe, expect, it } from 'vitest';
import { classifyGroceryScope } from './grocery-scope.js';

describe('B5 real flyer scope regression', () => {
  it.each([
    ['Avocados','product of Mexico 5 pk',null,'IN_SCOPE','GROCERY'],
    ['Barebells protein drink','Selected flavours. 4 x 325 mL','Barebells','IN_SCOPE','GROCERY'],
    ['10" Multipan or grill pan','Each',null,'OUT_OF_SCOPE','KITCHENWARE'],
    ['27" Monitor','Each. #50542182','onn.','OUT_OF_SCOPE','ELECTRONICS'],
    ['6" Mattress','Each. Twin','Zinus','OUT_OF_SCOPE','HOME_DECOR'],
    ['Advent Calendar','212 g',"Reese's",'IN_SCOPE','GROCERY'],
    ['Authentic Italian Charcuterie Meats','selected 100-200 g','Fantino & Mondello','IN_SCOPE','GROCERY'],
    ['Baking Mixes','375 g','Best Buy','IN_SCOPE','GROCERY'],
    ['Air Wick scented oil kit with 2 warmers and 5 refills','Selected varieties','Air Wick','IN_SCOPE','HOUSEHOLD'],
    ['Always pads or liners','Selected varieties and sizes','Always','IN_SCOPE','PERSONAL_CARE'],
    ['Anjou Pears','Product of USA / No.1 Grade',null,'IN_SCOPE','GROCERY'],
    ['Apna Taste perra','Each. Frozen. / 400 g','APNA TASTE','IN_SCOPE','GROCERY'],
  ] as const)('%s -> %s (%s)',(name,description,brand,status,category)=>{
    const result=classifyGroceryScope({name,description,brand});
    expect(result.status).toBe(status);
    expect(result.category).toBe(category);
  });
  it('does not confuse a medical monitor with a computer monitor',()=>{
    expect(classifyGroceryScope({name:'Blood glucose monitor'}).status).not.toBe('OUT_OF_SCOPE');
  });
  it('does not classify an unspecified advent calendar as edible',()=>{
    expect(classifyGroceryScope({name:'Advent Calendar',description:'24 surprise toys'}).status).not.toBe('IN_SCOPE');
  });
  it('does not treat a store/brand name as sufficient product evidence',()=>{
    expect(classifyGroceryScope({name:'Mystery item',brand:'Best Buy'}).status).toBe('REVIEW');
  });
});
