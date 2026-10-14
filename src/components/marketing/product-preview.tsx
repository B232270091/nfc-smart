import { messages } from '@/lib/messages/mn';
import { ArrowUpRight, Check, Coffee, Nfc, QrCode, Radio, Utensils } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="product-scene" role="img" aria-label={messages.componentsMarketingProductPreview.arialabel}>
      <div className="scene-orbit orbit-one" /><div className="scene-orbit orbit-two" />
      <div className="scene-dot scene-dot-one" /><div className="scene-dot scene-dot-two" />
      <div className="nfc-demo-card">
        <div className="demo-card-top"><span className="demo-brand"><Nfc size={22} /> NFC Smart</span><ArrowUpRight size={20} /></div>
        <div className="card-wave"><Radio size={65} strokeWidth={1} /></div>
        <div className="demo-card-bottom"><span>{messages.componentsMarketingProductPreview.span}<br /><strong>{messages.componentsMarketingProductPreview.strong}</strong></span><span className="card-label">TAP TO CONNECT</span></div>
      </div>
      <div className="preview-phone">
        <div className="phone-speaker" />
        <div className="phone-browser"><span className="tiny-lock" /> nfc.smart / your-business</div>
        <div className="phone-cover"><div className="cover-circle" /><Coffee size={35} strokeWidth={1.25} /><span>{messages.componentsMarketingProductPreview.span2}<br /><b>{messages.componentsMarketingProductPreview.b}</b></span></div>
        <div className="phone-menu-body"><div className="phone-restaurant"><span className="restaurant-icon"><Coffee size={18} /></span><div><b>{messages.componentsMarketingProductPreview.b2}</b><span>{messages.componentsMarketingProductPreview.span3}</span></div><QrCode size={21} /></div>
          <div className="preview-categories"><span>{messages.componentsMarketingProductPreview.span4}</span><span>{messages.componentsMarketingProductPreview.span5}</span><span>{messages.componentsMarketingProductPreview.span6}</span></div>
          <div className="preview-product"><div className="coffee-art"><span className="cup" /></div><div><b>{messages.componentsMarketingProductPreview.b3}</b><span>{messages.componentsMarketingProductPreview.span7}</span><strong>8,500 ₮</strong></div></div>
          <div className="preview-product"><div className="dessert-art"><span /></div><div><b>{messages.componentsMarketingProductPreview.b4}</b><span>{messages.componentsMarketingProductPreview.span8}</span><strong>12,000 ₮</strong></div></div>
          <div className="phone-footer"><Nfc size={11} /> Powered by NFC Smart</div>
        </div>
      </div>
      <div className="scene-status"><span><Check size={14} /></span><div><b>{messages.componentsMarketingProductPreview.b5}</b><small>{messages.componentsMarketingProductPreview.small}</small></div></div>
      <span className="scene-example"><Utensils size={12} />{messages.componentsMarketingProductPreview.span9}</span>
    </div>
  );
}
