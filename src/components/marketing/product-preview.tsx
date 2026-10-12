import { ArrowUpRight, Check, Coffee, Nfc, QrCode, Radio, Utensils } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="product-scene" role="img" aria-label="NFC Smart карт болон дижитал менюгийн загвар жишээ">
      <div className="scene-orbit orbit-one" /><div className="scene-orbit orbit-two" />
      <div className="scene-dot scene-dot-one" /><div className="scene-dot scene-dot-two" />
      <div className="nfc-demo-card">
        <div className="demo-card-top"><span className="demo-brand"><Nfc size={22} /> NFC Smart</span><ArrowUpRight size={20} /></div>
        <div className="card-wave"><Radio size={65} strokeWidth={1} /></div>
        <div className="demo-card-bottom"><span>Нэг хүрэлт.<br /><strong>Шинэ боломж.</strong></span><span className="card-label">TAP TO CONNECT</span></div>
      </div>
      <div className="preview-phone">
        <div className="phone-speaker" />
        <div className="phone-browser"><span className="tiny-lock" /> nfc.smart / your-business</div>
        <div className="phone-cover"><div className="cover-circle" /><Coffee size={35} strokeWidth={1.25} /><span>Өдөр бүрийн<br /><b>жижиг жаргал.</b></span></div>
        <div className="phone-menu-body"><div className="phone-restaurant"><span className="restaurant-icon"><Coffee size={18} /></span><div><b>Таны кафе</b><span>Дижитал меню · Загвар жишээ</span></div><QrCode size={21} /></div>
          <div className="preview-categories"><span>Кофе</span><span>Амттан</span><span>Ундаа</span></div>
          <div className="preview-product"><div className="coffee-art"><span className="cup" /></div><div><b>Капучино</b><span>Эспрессо, сүүн хөөс</span><strong>8,500 ₮</strong></div></div>
          <div className="preview-product"><div className="dessert-art"><span /></div><div><b>Чизкейк</b><span>Зөөлөн, шинэхэн амт</span><strong>12,000 ₮</strong></div></div>
          <div className="phone-footer"><Nfc size={11} /> Powered by NFC Smart</div>
        </div>
      </div>
      <div className="scene-status"><span><Check size={14} /></span><div><b>Меню шинэчлэгдлээ</b><small>Картын холбоос хэвээр үлдэнэ</small></div></div>
      <span className="scene-example"><Utensils size={12} /> Бүтээгдэхүүний загвар дүрслэл</span>
    </div>
  );
}
