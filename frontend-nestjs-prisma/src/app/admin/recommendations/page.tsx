'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
import {
    PageHeader, StatsCard, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface RecommendationStats {
    indexedProducts: number;
    userVectors: number;
    trendingProducts: number;
    coOccurrenceEntries: number;
}

interface ProductRec {
    productId: string;
    name: string;
    score: number;
    reason: string;
    price: number;
    image: string;
}

export default function AdminRecommendationsPage() {
    const [stats, setStats] = useState<RecommendationStats | null>(null);
    const [trending, setTrending] = useState<ProductRec[]>([]);
    const [popular, setPopular] = useState<ProductRec[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, trendingRes, popularRes] = await Promise.all([
                apiClient.get('/products/recommendations/stats').catch(() => null),
                apiClient.get('/products/recommendations/trending?limit=10').catch(() => null),
                apiClient.get('/products/recommendations/popular?limit=10').catch(() => null),
            ]);

            if (statsRes) {
                const s = statsRes.data.data || statsRes.data;
                setStats({
                    indexedProducts: s.indexedProducts || 0, userVectors: s.userVectors || 0,
                    trendingProducts: s.trendingProducts || 0, coOccurrenceEntries: s.coOccurrenceEntries || 0,
                });
            }

            const mapProducts = (res: { data: { data?: unknown } } | null): ProductRec[] => {
                if (!res) return [];
                const data = res.data.data || res.data;
                const products = Array.isArray(data) ? data : (data as Record<string, unknown>).products || [];
                return (products as Record<string, unknown>[]).map(p => ({
                    productId: String(p.productId || p.id || ''),
                    name: String(p.name || p.productName || 'Product'),
                    score: Number(p.score || 0),
                    reason: String(p.reason || ''),
                    price: Number(p.price || 0),
                    image: String(p.image || p.imageUrl || ''),
                }));
            };

            setTrending(mapProducts(trendingRes));
            setPopular(mapProducts(popularRes));
        } catch { toast.error('Không thể tải dữ liệu recommendations'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

    if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

    return (
        <div className="space-y-6">
            <PageHeader title="ML Recommendations" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Recommendations' }]} />

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatsCard title="Sản phẩm indexed" value={stats.indexedProducts.toLocaleString()} icon="📦" iconBg="bg-blue-100" />
                    <StatsCard title="User vectors" value={stats.userVectors.toLocaleString()} icon="👥" iconBg="bg-green-100" />
                    <StatsCard title="Trending" value={stats.trendingProducts} icon="📈" iconBg="bg-orange-100" />
                    <StatsCard title="Co-occurrence" value={stats.coOccurrenceEntries.toLocaleString()} icon="🔗" iconBg="bg-purple-100" />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="🔥 Trending Products">
                    {trending.length > 0 ? (
                        <div className="space-y-3">
                            {trending.map((p, i) => (
                                <div key={p.productId} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 w-6 font-bold">#{i + 1}</span>
                                        {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />}
                                        <div>
                                            <div className="text-sm font-medium">{p.name}</div>
                                            {p.price > 0 && <div className="text-xs text-gray-500">{fmt(p.price)}</div>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-orange-600">{p.score.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">{p.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu trending</p>}
                </Card>

                <Card title="⭐ Popular Products">
                    {popular.length > 0 ? (
                        <div className="space-y-3">
                            {popular.map((p, i) => (
                                <div key={p.productId} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 w-6 font-bold">#{i + 1}</span>
                                        {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />}
                                        <div>
                                            <div className="text-sm font-medium">{p.name}</div>
                                            {p.price > 0 && <div className="text-xs text-gray-500">{fmt(p.price)}</div>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-indigo-600">{p.score.toFixed(2)}</div>
                                        <div className="text-xs text-gray-400">{p.reason}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-gray-500 text-sm text-center py-4">Chưa có dữ liệu popular</p>}
                </Card>
            </div>

            <Card title="Thông tin Recommendation Engine">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Collaborative Filtering</h4>
                            <p className="text-xs text-gray-600">Dựa trên hành vi của người dùng tương tự để gợi ý sản phẩm. Sử dụng Jaccard similarity cho user vectors.</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Content-Based Filtering</h4>
                            <p className="text-xs text-gray-600">Phân tích đặc điểm sản phẩm (category, brand, tags, price range) để đề xuất sản phẩm tương tự.</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Co-occurrence Matrix</h4>
                            <p className="text-xs text-gray-600">Theo dõi các sản phẩm thường được mua cùng nhau để gợi ý &quot;Frequently Bought Together&quot;.</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm mb-2">Trending Score</h4>
                            <p className="text-xs text-gray-600">Tính toán điểm trending dựa trên lượt xem, mua hàng và thêm vào giỏ hàng với time decay.</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
