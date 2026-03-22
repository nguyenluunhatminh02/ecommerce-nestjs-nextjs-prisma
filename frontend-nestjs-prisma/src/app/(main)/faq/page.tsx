'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { faqService } from '@/services';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const data = await faqService.getAll();
        setFaqs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch FAQs:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];

  return (
    <div className="container-custom py-8">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">Trang chủ</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Câu hỏi thường gặp</span>
      </nav>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-bold mb-2">Câu Hỏi Thường Gặp</h1>
          <p className="text-muted-foreground">Tìm câu trả lời cho các thắc mắc phổ biến</p>
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm câu hỏi..."
            className="input-field w-full pl-12 h-12 rounded-xl text-base"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat || '')}
                className="px-3 py-1.5 text-sm rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-16">
            <HelpCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Không tìm thấy câu hỏi phù hợp' : 'Chưa có câu hỏi nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  {expandedId === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>
                {expandedId === faq.id && (
                  <div className="px-5 pb-5 text-muted-foreground border-t">
                    <p className="pt-4 whitespace-pre-line">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
