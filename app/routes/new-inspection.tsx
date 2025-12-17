import React, { useState, useEffect } from 'react';
import { Form, redirect, useActionData, useNavigate, useLoaderData } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { COMPANY_NAME, FORM_TITLE, INITIAL_SECTION_A, INITIAL_SECTION_B } from '../constants';
import { Inspection } from '../db/models/Inspection';
import { User } from '../db/models/User';
import { connectDB } from '../db/connect';
import { requireUserId } from '../utils/session.server';
import { InspectionStatus, type InspectionReport } from '~/types';


export async function loader({ request }: LoaderFunctionArgs) {
    const userId = await requireUserId(request);
    await connectDB();
    const user = await User.findById(userId);
    return { user: JSON.parse(JSON.stringify(user)) };
}

export async function action({ request }: ActionFunctionArgs) {
    await requireUserId(request);
    await connectDB();
    const formData = await request.formData();
    const reportData = formData.get('reportData') as string;

    if (!reportData) {
        return { error: 'Invalid form data', success: false };
    }

    try {
        const report = JSON.parse(reportData);
        // Ensure no ID is passed to create a new one, or Mongoose handles it.
        delete report.id;
        delete report._id;

        await Inspection.create(report);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to submit report. Please try again.', success: false };
    }
}

export default function NewInspection() {
    const navigate = useNavigate();
    const actionData = useActionData() as { error?: string; success?: boolean } | undefined;
    const { user } = useLoaderData() as { user: any };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [report, setReport] = useState<InspectionReport>({
        id: '',
        timestamp: Date.now(),
        inspectorName: user.name || '',
        isCompleted: false,
        header: {
            vehicleReg: 'WR 1838-11',
            date: new Date().toISOString().split('T')[0],
            roadWorthiness: 'Valid',
            insurance: 'Valid'
        },
        sectionA: [...INITIAL_SECTION_A],
        sectionB: [...INITIAL_SECTION_B],
    });

    useEffect(() => {
        if (actionData?.error) {
            toast.error(actionData.error);
            setIsSubmitting(false);
        }
        if (actionData?.success) {
            toast.success('Inspection Report Submitted Successfully!');
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [actionData, navigate]);

    const handleHeaderChange = (field: keyof typeof report.header, value: any) => {
        setReport(prev => ({
            ...prev,
            header: { ...prev.header, [field]: value }
        }));
    };

    const handleSectionAChange = (id: string, field: 'status' | 'remarks' | 'value', value: any) => {
        setReport(prev => ({
            ...prev,
            sectionA: prev.sectionA.map(item => {
                if (item.id !== id) return item;
                return { ...item, [field]: value };
            })
        }));
    };

    const handleSectionBChange = (id: string, field: 'value' | 'status' | 'remarks', value: any) => {
        setReport(prev => ({
            ...prev,
            sectionB: prev.sectionB.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

    const calculateProgress = () => {
        const totalA = report.sectionA.length;
        const filledA = report.sectionA.filter(i => {
            if (i.type === 'input') return i.value && i.value.trim() !== '';
            return i.status !== undefined;
        }).length;

        const totalB = report.sectionB.length;
        const filledB = report.sectionB.filter(i => {
            if (i.type === 'check') return i.status !== undefined;
            return i.value && i.value.trim() !== '';
        }).length;

        const total = totalA + totalB + 1;
        const current = filledA + filledB + (report.header.date ? 1 : 0);

        return Math.min(100, Math.round((current / total) * 100));
    };

    const handleSubmit = (e: React.FormEvent) => {
        const errors = new Set<string>();

        if (!report.header.vehicleReg || report.header.vehicleReg.trim() === '') errors.add('vehicleReg');
        if (!report.header.date) errors.add('date');
        if (!report.header.roadWorthiness || report.header.roadWorthiness.trim() === '') errors.add('roadWorthiness');
        if (!report.header.insurance || report.header.insurance.trim() === '') errors.add('insurance');

        const incompleteItems = report.sectionA.filter(i => {
            if (i.type === 'check') return !i.status;
            return !i.value;
        });

        if (incompleteItems.length > 0) {
            e.preventDefault();
            incompleteItems.forEach(item => errors.add(item.id));
            toast.error(`Please complete all items in Section A. ${incompleteItems.length} remaining.`);
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        const missingRemarks = report.sectionA.filter(i => i.status === InspectionStatus.DEFECTIVE && !i.remarks);
        if (missingRemarks.length > 0) {
            e.preventDefault();
            missingRemarks.forEach(item => errors.add(`${item.id}-remarks`));
            toast.error("Please provide remarks for all defective items in Section A.");
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        const missingRemarksB = report.sectionB.filter(i => i.status === InspectionStatus.DEFECTIVE && !i.remarks);
        if (missingRemarksB.length > 0) {
            e.preventDefault();
            missingRemarksB.forEach(item => errors.add(`${item.id}-remarks`));
            toast.error("Please provide remarks for all defective items in Section B.");
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        const incompleteSectionB = report.sectionB.filter(i => {
            if (i.type === 'check') return !i.status;
            return !i.value || i.value.trim() === '';
        });
        if (incompleteSectionB.length > 0) {
            e.preventDefault();
            incompleteSectionB.forEach(item => errors.add(item.id));
            toast.error(`Please complete all items in Section B. ${incompleteSectionB.length} remaining.`);
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        if (errors.size > 0) {
            e.preventDefault();
            toast.error('Please fill in all required fields.');
            setValidationErrors(errors);
            setIsSubmitting(false);
            return;
        }

        setValidationErrors(new Set());
        setIsSubmitting(true);
    };

    const progress = calculateProgress();

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Sticky Progress Header */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur shadow-sm border-b border-slate-200 px-4 py-3 mb-6 -mx-4 md:mx-0 md:rounded-b-lg">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            type="button"
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="font-bold text-slate-700">New Inspection</h2>
                    </div>
                    <span className="text-sm font-medium text-gold-600">{progress}% Complete</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-gold-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <Form method="post" onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-xl shadow-lg border-t-4 border-gold-500">
                <input
                    type="hidden"
                    name="reportData"
                    value={JSON.stringify({ ...report, isCompleted: true })}
                />

                <div className="text-center space-y-2 border-b-2 border-slate-100 pb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-nzema-red tracking-tight">{COMPANY_NAME}</h1>
                    <h3 className="text-lg md:text-xl font-semibold text-slate-800">{FORM_TITLE}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Vehicle Registration No.</label>
                        <select
                            value={report.header.vehicleReg}
                            onChange={(e) => handleHeaderChange('vehicleReg', e.target.value)}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white ${validationErrors.has('vehicleReg') ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        >
                            <option value="" disabled>Select Vehicle</option>
                            <option value="WR 1838-11">WR 1838-11</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Inspection</label>
                        <input
                            type="date"
                            value={report.header.date}
                            onChange={(e) => handleHeaderChange('date', e.target.value)}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500 ${validationErrors.has('date') ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Road Worthiness Certificate:</label>
                        <select
                            value={report.header.roadWorthiness}
                            onChange={(e) => handleHeaderChange('roadWorthiness', e.target.value)}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white ${validationErrors.has('roadWorthiness') ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        >
                            <option value="">Select Status...</option>
                            <option value="Valid">Valid</option>
                            <option value="Expired">Expired</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Vehicle Insurance:</label>
                        <select
                            value={report.header.insurance}
                            onChange={(e) => handleHeaderChange('insurance', e.target.value)}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white ${validationErrors.has('insurance') ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                        >
                            <option value="">Select Status...</option>
                            <option value="Valid">Valid</option>
                            <option value="Expired">Expired</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Inspected by:</label>
                        <p className="text-lg font-bold text-slate-800 p-3 bg-white rounded-md border border-slate-300">
                            {report.inspectorName || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-sm text-yellow-800">
                    <p className="font-bold flex items-center gap-2"><AlertTriangle size={16} /> INSTRUCTIONS</p>
                    <p>Check If Defective, Tick (X) for Defect, (√) for OK. All defects must be described on bottom of DRB.</p>
                </div>

                {/* SECTION A */}
                <div className="space-y-4">
                    <div className="bg-slate-800 text-white p-3 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">SECTION A — FIRE TENDER</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReport(prev => ({
                                            ...prev,
                                            sectionA: prev.sectionA.map(item =>
                                                item.type === 'check'
                                                    ? { ...item, status: InspectionStatus.OK, remarks: '' }
                                                    : item
                                            )
                                        }));
                                        toast.success('All items marked as OK');
                                    }}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    <CheckCircle size={14} /> Mark All OK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReport(prev => ({
                                            ...prev,
                                            sectionA: prev.sectionA.map(item =>
                                                item.type === 'check'
                                                    ? { ...item, status: InspectionStatus.DEFECTIVE, remarks: '' }
                                                    : item
                                            )
                                        }));
                                        toast.error('All items marked as Defective - Please add remarks for each defect');
                                    }}
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    <XCircle size={14} /> Mark All Defective
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden border rounded-lg overflow-hidden border-slate-200 divide-y divide-slate-200">
                        {report.sectionA.map((item) => (
                            <div key={item.id} className="bg-white p-4 hover:bg-slate-50 transition-colors">
                                {item.type === 'input' ? (
                                    <>
                                        <div className="font-medium text-slate-700 mb-3">{item.label}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500 font-mono whitespace-nowrap">READING:</span>
                                            <input
                                                type="number"
                                                placeholder="Enter Value"
                                                className={`flex-1 p-2 border rounded focus:ring-2 focus:ring-gold-500 outline-none w-full ${validationErrors.has(item.id) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                value={item.value || ''}
                                                onChange={(e) => handleSectionAChange(item.id, 'value', e.target.value)}
                                                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-medium text-slate-700">{item.label}</div>
                                            <div className="flex gap-3">
                                                {/* OK Option */}
                                                <label className="cursor-pointer flex items-center">
                                                    <input
                                                        type="radio"
                                                        name={`status-mobile-${item.id}`}
                                                        className="peer sr-only"
                                                        checked={item.status === InspectionStatus.OK}
                                                        onChange={() => handleSectionAChange(item.id, 'status', InspectionStatus.OK)}
                                                    />
                                                    <div className="w-8 h-8 rounded border-2 border-slate-300 peer-checked:bg-green-500 peer-checked:border-green-500 text-white flex items-center justify-center transition-all">
                                                        <CheckCircle size={18} />
                                                    </div>
                                                </label>

                                                {/* Defect Option */}
                                                <label className="cursor-pointer flex items-center">
                                                    <input
                                                        type="radio"
                                                        name={`status-mobile-${item.id}`}
                                                        className="peer sr-only"
                                                        checked={item.status === InspectionStatus.DEFECTIVE}
                                                        onChange={() => handleSectionAChange(item.id, 'status', InspectionStatus.DEFECTIVE)}
                                                    />
                                                    <div className="w-8 h-8 rounded border-2 border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 text-white flex items-center justify-center transition-all">
                                                        <XCircle size={18} />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {item.status === InspectionStatus.DEFECTIVE && (
                                            <input
                                                type="text"
                                                placeholder="Describe defect..."
                                                value={item.remarks}
                                                onChange={(e) => handleSectionAChange(item.id, 'remarks', e.target.value)}
                                                className={`w-full p-2 border rounded outline-none transition-colors ${validationErrors.has(`${item.id}-remarks`)
                                                    ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                    : 'bg-white border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                    }`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto border rounded-lg border-slate-200">
                        <table className="w-full min-w-[600px] border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-sm uppercase text-left">
                                    <th className="p-3 w-1/3">Item</th>
                                    <th className="p-3 text-center w-24">OK (√)</th>
                                    <th className="p-3 text-center w-24">Defect (X)</th>
                                    <th className="p-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {report.sectionA.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-white">
                                        <td className="p-3 font-medium text-slate-700">{item.label}</td>
                                        {item.type === 'input' ? (
                                            <td colSpan={3} className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500 font-mono">READING:</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter Value"
                                                        className={`flex-1 p-2 border rounded focus:ring-2 focus:ring-gold-500 outline-none ${validationErrors.has(item.id) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                        value={item.value || ''}
                                                        onChange={(e) => handleSectionAChange(item.id, 'value', e.target.value)}
                                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                                        required
                                                    />
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-3 text-center">
                                                    <label className="cursor-pointer block h-full w-full flex justify-center items-center">
                                                        <input
                                                            type="radio"
                                                            name={`status-${item.id}`}
                                                            className="peer sr-only"
                                                            checked={item.status === InspectionStatus.OK}
                                                            onChange={() => handleSectionAChange(item.id, 'status', InspectionStatus.OK)}
                                                        />
                                                        <div className="w-6 h-6 rounded border-2 border-slate-300 peer-checked:bg-green-500 peer-checked:border-green-500 text-white flex items-center justify-center transition-all">
                                                            <CheckCircle size={16} />
                                                        </div>
                                                    </label>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <label className="cursor-pointer block h-full w-full flex justify-center items-center">
                                                        <input
                                                            type="radio"
                                                            name={`status-${item.id}`}
                                                            className="peer sr-only"
                                                            checked={item.status === InspectionStatus.DEFECTIVE}
                                                            onChange={() => handleSectionAChange(item.id, 'status', InspectionStatus.DEFECTIVE)}
                                                        />
                                                        <div className="w-6 h-6 rounded border-2 border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 text-white flex items-center justify-center transition-all">
                                                            <XCircle size={16} />
                                                        </div>
                                                    </label>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        placeholder={item.status === InspectionStatus.DEFECTIVE ? "Describe defect..." : "N/A"}
                                                        disabled={item.status !== InspectionStatus.DEFECTIVE}
                                                        value={item.remarks}
                                                        onChange={(e) => handleSectionAChange(item.id, 'remarks', e.target.value)}
                                                        className={`w-full p-2 border rounded outline-none transition-colors ${validationErrors.has(`${item.id}-remarks`)
                                                            ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                            : item.status === InspectionStatus.DEFECTIVE
                                                                ? 'bg-white border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                    />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SECTION B */}
                <div className="space-y-4">
                    <div className="bg-slate-800 text-white p-3 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">SECTION B — PORTABLE FIRE PUMP</h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReport(prev => ({
                                            ...prev,
                                            sectionB: prev.sectionB.map(item =>
                                                item.type === 'check'
                                                    ? { ...item, status: InspectionStatus.OK, remarks: '' }
                                                    : item
                                            )
                                        }));
                                        toast.success('All Section B items marked as OK');
                                    }}
                                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    <CheckCircle size={14} /> Mark All OK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReport(prev => ({
                                            ...prev,
                                            sectionB: prev.sectionB.map(item =>
                                                item.type === 'check'
                                                    ? { ...item, status: InspectionStatus.DEFECTIVE, remarks: '' }
                                                    : item
                                            )
                                        }));
                                        toast.error('All Section B items marked as Defective');
                                    }}
                                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    <XCircle size={14} /> Mark All Defective
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden border rounded-lg overflow-hidden border-slate-200 divide-y divide-slate-200">
                        {report.sectionB.map((item) => (
                            <div key={item.id} className="bg-white p-4 hover:bg-slate-50 transition-colors">
                                {item.type === 'input' ? (
                                    <>
                                        <div className="font-medium text-slate-700 mb-3">{item.label}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500 font-mono whitespace-nowrap">READING:</span>
                                            <input
                                                type="number"
                                                placeholder="Enter Value"
                                                className={`flex-1 p-2 border rounded focus:ring-2 focus:ring-gold-500 outline-none w-full ${validationErrors.has(item.id) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                value={item.value || ''}
                                                onChange={(e) => handleSectionBChange(item.id, 'value', e.target.value)}
                                                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                                required
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-medium text-slate-700">{item.label}</div>
                                            <div className="flex gap-3">
                                                {/* OK Option */}
                                                <label className="cursor-pointer flex items-center">
                                                    <input
                                                        type="radio"
                                                        name={`status-mobile-b-${item.id}`}
                                                        className="peer sr-only"
                                                        checked={item.status === InspectionStatus.OK}
                                                        onChange={() => handleSectionBChange(item.id, 'status', InspectionStatus.OK)}
                                                    />
                                                    <div className="w-8 h-8 rounded border-2 border-slate-300 peer-checked:bg-green-500 peer-checked:border-green-500 text-white flex items-center justify-center transition-all">
                                                        <CheckCircle size={18} />
                                                    </div>
                                                </label>

                                                {/* Defect Option */}
                                                <label className="cursor-pointer flex items-center">
                                                    <input
                                                        type="radio"
                                                        name={`status-mobile-b-${item.id}`}
                                                        className="peer sr-only"
                                                        checked={item.status === InspectionStatus.DEFECTIVE}
                                                        onChange={() => handleSectionBChange(item.id, 'status', InspectionStatus.DEFECTIVE)}
                                                    />
                                                    <div className="w-8 h-8 rounded border-2 border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 text-white flex items-center justify-center transition-all">
                                                        <XCircle size={18} />
                                                    </div>
                                                </label>
                                            </div>
                                        </div>

                                        {item.status === InspectionStatus.DEFECTIVE && (
                                            <input
                                                type="text"
                                                placeholder="Describe defect..."
                                                value={item.remarks}
                                                onChange={(e) => handleSectionBChange(item.id, 'remarks', e.target.value)}
                                                className={`w-full p-2 border rounded outline-none transition-colors ${validationErrors.has(`${item.id}-remarks`)
                                                    ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                    : 'bg-white border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                    }`}
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto border rounded-lg border-slate-200">
                        <table className="w-full min-w-[600px] border-collapse">
                            <thead>
                                <tr className="bg-slate-100 text-slate-600 text-sm uppercase text-left">
                                    <th className="p-3 w-1/3">Item</th>
                                    <th className="p-3 text-center w-24">OK (√)</th>
                                    <th className="p-3 text-center w-24">Defect (X)</th>
                                    <th className="p-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {report.sectionB.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors bg-white">
                                        <td className="p-3 font-medium text-slate-700">{item.label}</td>
                                        {item.type === 'input' ? (
                                            <td colSpan={3} className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500 font-mono">READING:</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Enter Value"
                                                        className={`flex-1 p-2 border rounded focus:ring-2 focus:ring-gold-500 outline-none ${validationErrors.has(item.id) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                                        value={item.value || ''}
                                                        onChange={(e) => handleSectionBChange(item.id, 'value', e.target.value)}
                                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                                        required
                                                    />
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="p-3 text-center">
                                                    <label className="cursor-pointer block h-full w-full flex justify-center items-center">
                                                        <input
                                                            type="radio"
                                                            name={`status-b-${item.id}`}
                                                            className="peer sr-only"
                                                            checked={item.status === InspectionStatus.OK}
                                                            onChange={() => handleSectionBChange(item.id, 'status', InspectionStatus.OK)}
                                                        />
                                                        <div className="w-6 h-6 rounded border-2 border-slate-300 peer-checked:bg-green-500 peer-checked:border-green-500 text-white flex items-center justify-center transition-all">
                                                            <CheckCircle size={16} />
                                                        </div>
                                                    </label>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <label className="cursor-pointer block h-full w-full flex justify-center items-center">
                                                        <input
                                                            type="radio"
                                                            name={`status-b-${item.id}`}
                                                            className="peer sr-only"
                                                            checked={item.status === InspectionStatus.DEFECTIVE}
                                                            onChange={() => handleSectionBChange(item.id, 'status', InspectionStatus.DEFECTIVE)}
                                                        />
                                                        <div className="w-6 h-6 rounded border-2 border-slate-300 peer-checked:bg-red-500 peer-checked:border-red-500 text-white flex items-center justify-center transition-all">
                                                            <XCircle size={16} />
                                                        </div>
                                                    </label>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        placeholder={item.status === InspectionStatus.DEFECTIVE ? "Describe defect..." : "N/A"}
                                                        disabled={item.status !== InspectionStatus.DEFECTIVE}
                                                        value={item.remarks}
                                                        onChange={(e) => handleSectionBChange(item.id, 'remarks', e.target.value)}
                                                        className={`w-full p-2 border rounded outline-none transition-colors ${validationErrors.has(`${item.id}-remarks`)
                                                            ? 'bg-red-50 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                            : item.status === InspectionStatus.DEFECTIVE
                                                                ? 'bg-white border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                    />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 bg-nzema-red text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-red-700 transition-all transform hover:-translate-y-1 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        <Save size={24} />
                        {isSubmitting ? 'Saving Report...' : 'Submit Report'}
                    </button>
                </div>

            </Form>
        </div>
    );
}
