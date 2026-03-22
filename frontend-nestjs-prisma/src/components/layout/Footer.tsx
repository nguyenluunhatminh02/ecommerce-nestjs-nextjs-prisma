import Link from 'next/link';
import { Store, Facebook, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-auto">
      {/* Newsletter */}
      <div className="bg-primary text-primary-foreground">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Đăng ký nhận tin khuyến mãi</h3>
              <p className="text-sm text-primary-foreground/80">
                Nhận thông tin ưu đãi và sản phẩm mới nhất
              </p>
            </div>
            <form className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Email của bạn"
                className="flex-1 md:w-80 h-11 px-4 rounded-l-lg text-foreground bg-background focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 h-11 bg-primary-foreground text-primary font-medium rounded-r-lg hover:bg-primary-foreground/90 transition-colors"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-gradient">ShopVN</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              ShopVN - Sàn thương mại điện tử hàng đầu Việt Nam. Mua sắm trực tuyến hàng triệu sản
              phẩm với giá tốt nhất.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>123 Nguyễn Huệ, Q.1, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>1900-1234</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@shopvn.com</span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ Khách Hàng</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Trung tâm trợ giúp', href: '/support' },
                { label: 'Câu hỏi thường gặp', href: '/faq' },
                { label: 'Chính sách đổi trả', href: '/returns' },
                { label: 'Mã giảm giá', href: '/coupons' },
                { label: 'Khuyến mãi', href: '/promotions' },
                { label: 'Thẻ quà tặng', href: '/gift-cards' },
                { label: 'Flash Sale', href: '/flash-sales' },
                { label: 'Bộ sưu tập', href: '/collections' },
                { label: 'Thương hiệu', href: '/brands' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-semibold mb-4">Về ShopVN</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Giới thiệu', href: '/about' },
                { label: 'Tuyển dụng', href: '/seller/dashboard' },
                { label: 'Điều khoản sử dụng', href: '/support?topic=terms' },
                { label: 'Chính sách bảo mật', href: '/support?topic=privacy' },
                { label: 'Blog', href: '/blog' },
                { label: 'Liên hệ', href: '/support?topic=contact' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partner */}
          <div>
            <h4 className="font-semibold mb-4">Hợp Tác & Liên Kết</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Bán hàng cùng ShopVN', href: '/auth/register' },
                { label: 'Chương trình Affiliate', href: '/affiliate' },
                { label: 'Loyalty & Tích điểm', href: '/loyalty' },
                { label: 'Ví ShopVN', href: '/wallet' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <ChevronRight className="w-3 h-3" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold mt-6 mb-3">Theo dõi chúng tôi</h4>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4 text-primary" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 0 0-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 0 0-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 0 1-2.228-.616v.06a4.923 4.923 0 0 0 3.946 4.827 4.996 4.996 0 0 1-2.212.085 4.936 4.936 0 0 0 4.604 3.417 9.867 9.867 0 0 1-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0 0 7.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0 0 24 4.59z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.172.054 1.978.24 2.43.403.61.236 1.044.518 1.5.975.457.457.739.89.975 1.5.163.452.35 1.258.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.172-.24 1.978-.403 2.43-.236.61-.518 1.044-.975 1.5-.457.457-.89.739-1.5.975-.452.163-1.258.35-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.172-.054-1.978-.24-2.43-.403-.61-.236-1.044-.518-1.5-.975-.457-.457-.739-.89-.975-1.5-.163-.452-.35-1.258-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.172.24-1.978.403-2.43.236-.61.518-1.044.975-1.5.457-.457.89-.739 1.5-.975.452-.163 1.258-.35 2.43-.403C8.416 2.175 8.796 2.163 12 2.163M12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.902.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.902.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.059 1.277.261 2.15.558 2.912.306.789.717 1.459 1.384 2.126.667.667 1.337 1.078 2.126 1.384.762.297 1.636.499 2.913.558C8.333 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.059 2.15-.261 2.912-.558.789-.306 1.459-.717 2.126-1.384.667-.667 1.078-1.337 1.384-2.126.297-.762.499-1.636.558-2.913.058-1.28.072-1.688.072-4.948s-.014-3.668-.072-4.948c-.059-1.277-.261-2.15-.558-2.912-.306-.789-.717-1.459-1.384-2.126C21.319 1.347 20.649.935 19.86.63 19.098.333 18.225.131 16.948.072 15.668.014 15.259 0 12 0z" />
                  <path d="M12 5.838a6.163 6.163 0 1 0 0 12.326 6.163 6.163 0 0 0 0-12.326zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-10.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
            </div>

            <h4 className="font-semibold mt-6 mb-3">Tải ứng dụng</h4>
            <div className="flex items-center gap-2">
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Google Play"
                  className="h-10"
                />
              </a>
              <a href="#" className="block">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="App Store"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t">
        <div className="container-custom py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} ShopVN. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <Link href="/support?topic=terms" className="hover:text-primary transition-colors">
              Điều khoản
            </Link>
            <Link href="/support?topic=privacy" className="hover:text-primary transition-colors">
              Bảo mật
            </Link>
            <Link href="/support?topic=cookies" className="hover:text-primary transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
