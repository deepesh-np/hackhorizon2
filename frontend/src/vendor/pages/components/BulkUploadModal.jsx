import { useState, useRef } from 'react';
import api from '../../../services/api';

export default function BulkUploadModal({ onClose, onSuccess }) {
    const [step, setStep] = useState('upload');
    const [parsedRows, setParsedRows] = useState([]);
    const [fileName, setFileName] = useState('');
    const [parseError, setParseError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const REQUIRED_HEADERS = ['medicineName', 'price'];
    const ALL_HEADERS = ['medicineName', 'price', 'mrp', 'discount', 'stock', 'batchNumber', 'expiryDate'];

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const downloadTemplate = () => {
        const csvContent = ALL_HEADERS.join(',') + '\n'
            + 'Paracetamol 500mg,25,30,16,100,BATCH001,2026-12-01\n'
            + 'Amoxicillin 250mg,45,55,18,50,BATCH002,2026-06-15\n'
            + 'Cetirizine 10mg,12,15,20,200,BATCH003,2027-03-01\n';

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'inventory_template.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const parseCSV = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            setParseError('CSV must have a header row and at least one data row.');
            return;
        }

        const rawHeaders = lines[0].split(',').map(h => h.trim());

        // Map headers to expected field names (case-insensitive, flexible naming)
        const headerMap = rawHeaders.map(h => {
            const lower = h.toLowerCase().replace(/[\s_-]+/g, '');
            if (['medicinename', 'medicine', 'name', 'drugname', 'drug'].includes(lower)) return 'medicineName';
            if (['price', 'sellingprice', 'yourprice'].includes(lower)) return 'price';
            if (['mrp', 'maximumretailprice', 'maxprice'].includes(lower)) return 'mrp';
            if (['discount', 'disc', 'discountpercent'].includes(lower)) return 'discount';
            if (['stock', 'quantity', 'qty', 'count'].includes(lower)) return 'stock';
            if (['batchnumber', 'batch', 'batchno', 'batchid'].includes(lower)) return 'batchNumber';
            if (['expirydate', 'expiry', 'exp', 'expdate', 'expirationdate'].includes(lower)) return 'expiryDate';
            return null;
        });

        // Check required headers
        const mappedNames = headerMap.filter(Boolean);
        for (const req of REQUIRED_HEADERS) {
            if (!mappedNames.includes(req)) {
                setParseError(`Missing required column: "${req}". Detected columns: ${rawHeaders.join(', ')}`);
                return;
            }
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const row = {};
            headerMap.forEach((field, idx) => {
                if (field && idx < values.length) {
                    row[field] = values[idx].trim();
                }
            });

            if (row.medicineName) {
                rows.push(row);
            }
        }

        if (rows.length === 0) {
            setParseError('No valid data rows found in the CSV.');
            return;
        }

        if (rows.length > 200) {
            setParseError(`Too many rows (${rows.length}). Maximum is 200 items per upload.`);
            return;
        }

        setParseError(null);
        setParsedRows(rows);
        setStep('preview');
    };

    // Handle quoted CSV values correctly
    const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        const isCSV = validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.txt');

        if (!isCSV) {
            setParseError('Please upload a .csv file.');
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => parseCSV(e.target.result);
        reader.onerror = () => setParseError('Failed to read file.');
        reader.readAsText(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            const res = await api.post('/vendor/inventory/bulk', { items: parsedRows });
            setResults(res.data);
            setStep('results');
        } catch (err) {
            console.error('Bulk upload error:', err);
            setResults({
                success: false,
                message: err.response?.data?.message || 'Bulk upload failed. Please try again.',
                summary: { total: parsedRows.length, successCount: 0, skipCount: 0, failCount: parsedRows.length },
                results: [],
            });
            setStep('results');
        } finally {
            setUploading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === 'success') return 'text-[#1B7B3A] bg-[#D5F5E3]';
        if (status === 'skipped') return 'text-[#B7950B] bg-[#FEF9E7]';
        return 'text-[#C0392B] bg-[#FADBD8]';
    };

    const getStatusIcon = (status) => {
        if (status === 'success') return '✓';
        if (status === 'skipped') return '⟳';
        return '✕';
    };

    return (
        <div
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/35 flex items-center justify-center z-[100]"
        >
            <div className="bg-white rounded-2xl border border-[#C8DDD0] w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3.5 px-4 border-b border-[#D5E8DC] bg-[#E8F5ED] shrink-0">
                    <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="#1B7B3A" className="w-4 h-4">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                        </svg>
                        <span className="text-sm font-medium text-[#145C2C]">
                            {step === 'upload' && 'Bulk Upload Inventory'}
                            {step === 'preview' && `Preview — ${parsedRows.length} items`}
                            {step === 'results' && 'Upload Results'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-md border border-[#C8DDD0] bg-white cursor-pointer flex items-center justify-center text-sm text-[#5a7060] hover:bg-[#f0f0f0]"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* STEP 1: Upload */}
                    {step === 'upload' && (
                        <div className="flex flex-col gap-4">
                            <div className="p-2.5 px-3 bg-[#D5F5E3] rounded-lg flex items-start gap-2 text-[11px] text-[#1B7B3A]">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0 mt-px">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                                <div>
                                    <p className="font-medium mb-0.5">Upload a CSV file with your inventory data</p>
                                    <p className="text-[10px] text-[#2E7D32]/80">
                                        Required columns: <strong>medicineName</strong>, <strong>price</strong>.
                                        Optional: mrp, discount, stock, batchNumber, expiryDate.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 py-2 px-3 border border-dashed border-[#1B7B3A]/40 text-[#1B7B3A] rounded-lg text-xs font-medium hover:bg-[#E8F5ED] transition-colors cursor-pointer bg-white"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                                </svg>
                                Download CSV Template
                            </button>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                    dragOver
                                        ? 'border-[#1B7B3A] bg-[#E8F5ED]'
                                        : 'border-[#C8DDD0] hover:border-[#1B7B3A]/50 hover:bg-[#F7FAF8]'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files[0])}
                                />
                                <svg viewBox="0 0 24 24" fill="#1B7B3A" className="w-8 h-8 mx-auto mb-2.5 opacity-40">
                                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                </svg>
                                <p className="text-xs font-medium text-[#1a1a1a] mb-1">
                                    {fileName || 'Drag & drop your CSV file here'}
                                </p>
                                <p className="text-[10px] text-[#6b7c72]">
                                    or click to browse • Max 200 items per file
                                </p>
                            </div>

                            {parseError && (
                                <div className="p-2.5 px-3 bg-[#FADBD8] text-[#C0392B] rounded-lg text-[11px] flex items-start gap-2">
                                    <span className="font-bold text-sm">⚠</span>
                                    <span>{parseError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: Preview */}
                    {step === 'preview' && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[#6b7c72]">
                                    <strong className="text-[#1a1a1a]">{parsedRows.length}</strong> items from <strong className="text-[#1a1a1a]">{fileName}</strong>
                                </span>
                                <button
                                    onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}
                                    className="text-[10px] text-[#C0392B] font-medium cursor-pointer hover:underline bg-transparent border-none"
                                >
                                    ← Re-upload
                                </button>
                            </div>

                            <div className="border border-[#D5E8DC] rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-[#E8F5ED] sticky top-0 z-10">
                                            <tr>
                                                <th className="p-2 px-2.5 text-left font-medium text-[#145C2C] w-8">#</th>
                                                <th className="p-2 px-2.5 text-left font-medium text-[#145C2C]">Medicine Name</th>
                                                <th className="p-2 px-2.5 text-right font-medium text-[#145C2C] w-16">Price</th>
                                                <th className="p-2 px-2.5 text-right font-medium text-[#145C2C] w-14">MRP</th>
                                                <th className="p-2 px-2.5 text-right font-medium text-[#145C2C] w-14">Disc%</th>
                                                <th className="p-2 px-2.5 text-right font-medium text-[#145C2C] w-14">Stock</th>
                                                <th className="p-2 px-2.5 text-left font-medium text-[#145C2C] w-20">Batch</th>
                                                <th className="p-2 px-2.5 text-left font-medium text-[#145C2C] w-24">Expiry</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedRows.map((row, idx) => (
                                                <tr key={idx} className={`border-t border-[#EEF5F1] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFDF9]'}`}>
                                                    <td className="p-2 px-2.5 text-[#9ab0a0]">{idx + 1}</td>
                                                    <td className="p-2 px-2.5 font-medium text-[#1a1a1a] max-w-[180px] truncate">{row.medicineName}</td>
                                                    <td className="p-2 px-2.5 text-right text-[#1B7B3A] font-medium">₹{row.price}</td>
                                                    <td className="p-2 px-2.5 text-right text-[#6b7c72]">{row.mrp ? `₹${row.mrp}` : '—'}</td>
                                                    <td className="p-2 px-2.5 text-right text-[#6b7c72]">{row.discount || '0'}%</td>
                                                    <td className="p-2 px-2.5 text-right text-[#6b7c72]">{row.stock || '0'}</td>
                                                    <td className="p-2 px-2.5 text-[#6b7c72] truncate">{row.batchNumber || '—'}</td>
                                                    <td className="p-2 px-2.5 text-[#6b7c72]">{row.expiryDate || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Results */}
                    {step === 'results' && results && (
                        <div className="flex flex-col gap-3">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-2.5">
                                <div className="bg-[#D5F5E3] rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-[#1B7B3A]">{results.summary?.successCount || 0}</div>
                                    <div className="text-[10px] font-medium text-[#2E7D32]">Added</div>
                                </div>
                                <div className="bg-[#FEF9E7] rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-[#B7950B]">{results.summary?.skipCount || 0}</div>
                                    <div className="text-[10px] font-medium text-[#B7950B]">Skipped</div>
                                </div>
                                <div className="bg-[#FADBD8] rounded-xl p-3 text-center">
                                    <div className="text-xl font-bold text-[#C0392B]">{results.summary?.failCount || 0}</div>
                                    <div className="text-[10px] font-medium text-[#C0392B]">Failed</div>
                                </div>
                            </div>

                            <p className="text-xs text-[#6b7c72] text-center">{results.message}</p>

                            {results.results?.length > 0 && (
                                <div className="border border-[#D5E8DC] rounded-xl overflow-hidden">
                                    <div className="overflow-y-auto max-h-[280px]">
                                        <table className="w-full text-[11px]">
                                            <thead className="bg-[#E8F5ED] sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-2 px-2.5 text-left font-medium text-[#145C2C] w-8">#</th>
                                                    <th className="p-2 px-2.5 text-center font-medium text-[#145C2C] w-10">Status</th>
                                                    <th className="p-2 px-2.5 text-left font-medium text-[#145C2C]">Medicine</th>
                                                    <th className="p-2 px-2.5 text-left font-medium text-[#145C2C]">Detail</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {results.results.map((r, idx) => (
                                                    <tr key={idx} className="border-t border-[#EEF5F1]">
                                                        <td className="p-2 px-2.5 text-[#9ab0a0]">{r.row}</td>
                                                        <td className="p-2 px-2.5 text-center">
                                                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${getStatusColor(r.status)}`}>
                                                                {getStatusIcon(r.status)}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 px-2.5 font-medium text-[#1a1a1a] max-w-[160px] truncate">{r.medicineName}</td>
                                                        <td className="p-2 px-2.5 text-[#6b7c72]">{r.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#D5E8DC] p-3 px-4 flex items-center justify-between gap-2 shrink-0 bg-[#FAFDF9]">
                    {step === 'upload' && (
                        <>
                            <span className="text-[10px] text-[#9ab0a0]">Supports .csv files</span>
                            <button
                                onClick={onClose}
                                className="py-2 px-4 border border-[#C8DDD0] text-[#5a7060] rounded-lg text-[12px] font-medium cursor-pointer bg-white hover:bg-[#F7FAF8] transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <span className="text-[10px] text-[#9ab0a0]">
                                {parsedRows.length} item{parsedRows.length !== 1 ? 's' : ''} ready to upload
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}
                                    className="py-2 px-4 border border-[#C8DDD0] text-[#5a7060] rounded-lg text-[12px] font-medium cursor-pointer bg-white hover:bg-[#F7FAF8] transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="py-2 px-5 bg-[#1B7B3A] text-white border-none rounded-lg text-[12px] font-medium cursor-pointer hover:bg-[#145C2C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    {uploading ? (
                                        <>
                                            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                                            </svg>
                                            Upload All
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'results' && (
                        <>
                            <span className="text-[10px] text-[#9ab0a0]">Upload complete</span>
                            <button
                                onClick={() => {
                                    if (results?.summary?.successCount > 0 && onSuccess) {
                                        onSuccess();
                                    } else {
                                        onClose();
                                    }
                                }}
                                className="py-2 px-5 bg-[#1B7B3A] text-white border-none rounded-lg text-[12px] font-medium cursor-pointer hover:bg-[#145C2C] transition-colors"
                            >
                                {results?.summary?.successCount > 0 ? 'Done — Refresh Inventory' : 'Close'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
