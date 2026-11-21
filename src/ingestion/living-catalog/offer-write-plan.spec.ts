import { describe, expect, it } from "vitest";
import { planAdvertisedOffer, type OfferEvidence } from "./offer-write-plan.js";
const base: OfferEvidence = {
  sourceSystemId:"flipp", retailerId:"walmart", flyerExternalId:"123", sourceRecordId:"456",
  marketKey:"T3M1T4", productName:"Blueberries", advertisedPriceAmount:2.99,
  regularPriceAmount:null, validFrom:new Date("2026-11-12T07:00:00Z"),
  validUntil:new Date("2026-11-19T06:59:59Z"), rawPayload:{a:1},
};
describe("offer write plan (pure, read-only)", () => {
  it("preserves unknown regular price",()=> {
    const p=planAdvertisedOffer(base);
    expect(p.action).toBe("UPSERT_OFFER");
    if(p.action==="UPSERT_OFFER")expect(p.evidence.regularPriceAmount).toBeNull();
  });
  it("same source item re-capture produces the same key",()=> {
    const a=planAdvertisedOffer(base),b=planAdvertisedOffer({...base,advertisedPriceAmount:1.99});
    if(a.action!=="UPSERT_OFFER"||b.action!=="UPSERT_OFFER")throw Error("bad plans");
    expect(a.stableKey).toBe(b.stableKey);
  });
  it("different markets stay separate",()=> {
    const a=planAdvertisedOffer(base),b=planAdvertisedOffer({...base,marketKey:"T2A4T8"});
    if(a.action!=="UPSERT_OFFER"||b.action!=="UPSERT_OFFER")throw Error("bad plans");
    expect(a.stableKey).not.toBe(b.stableKey);
  });
  it("different flyer items stay separate",()=> {
    const a=planAdvertisedOffer(base),b=planAdvertisedOffer({...base,sourceRecordId:"457"});
    if(a.action!=="UPSERT_OFFER"||b.action!=="UPSERT_OFFER")throw Error("bad plans");
    expect(a.stableKey).not.toBe(b.stableKey);
  });
  it("holds missing source identity",()=> {
    expect(planAdvertisedOffer({...base,sourceRecordId:""}).action).toBe("HOLD");
  });
  it("holds inverted promotion dates",()=> {
    expect(planAdvertisedOffer({...base,validFrom:new Date("2026-11-20T00:00:00Z")}).action).toBe("HOLD");
  });
  it("unknown dates can be preserved, not invented",()=> {
    expect(planAdvertisedOffer({...base,validFrom:null,validUntil:null}).action).toBe("UPSERT_OFFER");
  });
});
