import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';

function Footer({ className = "" }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`w-full bg-slate-900 text-slate-300 pt-12 pb-6 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 lg:px-14'>
        <div className='grid gap-12 md:grid-cols-2 lg:grid-cols-4 pb-10 border-b border-slate-800'>
          
          {/* Company Bio */}
          <div className='flex flex-col gap-4 col-span-1 lg:col-span-1'>
            <h4 className='font-bold text-white uppercase tracking-wider'>Our Company</h4>
            <p className='text-sm leading-relaxed'>
              Midroc Investment Group is a diversified conglomerate engaged in agriculture, manufacturing, mining, and hospitality, driving economic growth across Ethiopia.
            </p>
            <div className='flex gap-4 mt-2'>
              <SocialIcon icon={<Facebook size={18} />} href="#" />
              <SocialIcon icon={<Twitter size={18} />} href="#" />
              <SocialIcon icon={<Linkedin size={18} />} href="#" />
              <SocialIcon icon={<Instagram size={18} />} href="#" />
            </div>
          </div>

          {/* Quick Links */}
          <div className='flex flex-col gap-4'>
            <h4 className='font-bold text-white uppercase tracking-wider'>Quick Links</h4>
            <nav className='flex flex-col gap-2'>
              <FooterLink href="https://www.midrocinvestmentgroup.com/about-us">About Us</FooterLink>
              <FooterLink href="https://www.midrocinvestmentgroup.com/investment">Our Investments</FooterLink>
              <FooterLink href="#">Media Center</FooterLink>
              <FooterLink href="#">Sustainability</FooterLink>
            </nav>
          </div>

          {/* Contact Info */}
          <div className='flex flex-col gap-4'>
            <h4 className='font-bold text-white uppercase tracking-wider'>Contact Us</h4>
            <div className='flex flex-col gap-3 text-sm'>
              <div className='flex gap-3'>
                <MapPin size={18} className='text-green-500 shrink-0' />
                <span>Nani building, Stadium, Addis Ababa, Ethiopia</span>
              </div>
              <div className='flex gap-3'>
                <Phone size={18} className='text-green-500 shrink-0' />
                <span>(+251) 115549791/95</span>
              </div>
              <div className='flex gap-3 italic'>
                <Mail size={18} className='text-green-500 shrink-0' />
                <a href="mailto:migpr@midrocinvestmentgroup.com" className="hover:text-green-400 transition-colors">
                  migpr@midrocinvestmentgroup.com
                </a>
              </div>
            </div>
          </div>

          {/* Newsletter / External */}
          <div className='flex flex-col gap-4'>
            <h4 className='font-bold text-white uppercase tracking-wider'>Corporate</h4>
            <p className='text-sm mb-2'>Visit our official corporate portal for more information.</p>
            <a 
              href="https://www.midrocinvestmentgroup.com/" 
              target="_blank" 
              rel="noreferrer"
              className='flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-all active:scale-95'
            >
              Official Site <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500'>
          <p>© {currentYear} Midroc Investment Group. All rights reserved.</p>
          <div className='flex gap-6'>
            <a href="#" className='hover:text-slate-300'>Privacy Policy</a>
            <a href="#" className='hover:text-slate-300'>Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Helper Components
const FooterLink = ({ href, children }) => (
  <a 
    href={href} 
    className='text-sm hover:text-green-500 hover:translate-x-1 transition-all duration-200 inline-block'
  >
    {children}
  </a>
);

const SocialIcon = ({ icon, href }) => (
  <a 
    href={href} 
    className='w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-green-600 hover:text-white transition-all duration-300'
  >
    {icon}
  </a>
);

export default Footer;