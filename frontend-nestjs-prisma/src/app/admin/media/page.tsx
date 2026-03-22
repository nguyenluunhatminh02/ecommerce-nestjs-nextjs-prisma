'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient, { uploadClient } from '@/lib/api-client';
import {
    PageHeader, Card, LoadingSpinner
} from '@/components/admin/AdminComponents';
import toast from 'react-hot-toast';

interface MediaFile {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
}

export default function AdminMediaPage() {
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/files');
            const res = data.data || data;
            setFiles((Array.isArray(res) ? res : res.content || res.files || []).map((f: Record<string, unknown>) => ({
                id: String(f.id || ''), url: String(f.url || f.fileUrl || ''), filename: String(f.filename || f.originalName || ''),
                mimeType: String(f.mimeType || f.contentType || ''), size: Number(f.size || 0), createdAt: String(f.createdAt || ''),
            })));
        } catch { /* Media listing might not be available */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList?.length) return;
        setUploading(true);
        try {
            const formData = new FormData();
            if (fileList.length > 1) {
                Array.from(fileList).forEach(f => formData.append('files', f));
                await uploadClient.post('/files/upload-multiple', formData);
            } else {
                formData.append('file', fileList[0]);
                await uploadClient.post('/files/upload', formData);
            }
            toast.success('Upload thành công');
            fetchData();
        } catch { toast.error('Upload thất bại'); }
        finally { setUploading(false); e.target.value = ''; }
    };

    const handleDelete = async (url: string) => {
        if (!confirm('Bạn có chắc muốn xóa file này?')) return;
        try { await apiClient.delete('/files', { data: { url } }); toast.success('Đã xóa'); fetchData(); }
        catch { toast.error('Không thể xóa'); }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const isImage = (mime: string) => mime.startsWith('image/');

    return (
        <div className="space-y-6">
            <PageHeader title="Media Library" breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Media' }]}
                actions={
                    <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-2">
                        {uploading ? 'Đang upload...' : 'Upload file'}
                        <input type="file" multiple accept="image/*,video/*,application/pdf" onChange={handleUpload} className="hidden" />
                    </label>
                } />

            {loading ? <LoadingSpinner /> : files.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📁</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có file nào</h3>
                        <p className="text-gray-500 mb-4">Upload file đầu tiên để bắt đầu</p>
                        <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
                            Upload file <input type="file" multiple onChange={handleUpload} className="hidden" />
                        </label>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {files.map(f => (
                        <Card key={f.id} noPadding>
                            <div className="aspect-square bg-gray-100 relative group">
                                {isImage(f.mimeType) ? (
                                    <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-4xl">📄</div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white text-xs rounded">Xem</a>
                                    <button onClick={() => handleDelete(f.url)} className="px-2 py-1 bg-red-600 text-white text-xs rounded">Xóa</button>
                                </div>
                            </div>
                            <div className="p-2">
                                <div className="text-xs font-medium truncate">{f.filename}</div>
                                <div className="text-xs text-gray-500">{formatSize(f.size)}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
