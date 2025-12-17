import React from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import type { LoaderFunctionArgs } from 'react-router';
import { ArrowLeft, Printer, CheckCircle, XCircle } from 'lucide-react';
import { COMPANY_NAME, FORM_TITLE } from '../constants';
import { InspectionStatus, type InspectionReport } from '../types';
import { Inspection } from '../db/models/Inspection';
import { connectDB } from '../db/connect';
import { requireUserId } from '../utils/session.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireUserId(request);
    await connectDB();
    const { id } = params;
    if (!id) {
        throw new Response('Not Found', { status: 404 });
    }

    try {
        const report = await Inspection.findById(id);
        if (!report) {
            throw new Response('Not Found', { status: 404 });
        }
        return { report: JSON.parse(JSON.stringify(report)) };
    } catch (error) {
        throw new Response('Failed to load inspection', { status: 500 });
    }
}

export default function ViewInspection() {
    const { report } = useLoaderData() as { report: InspectionReport };
    const navigate = useNavigate();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 print:pb-0 print:max-w-none">
            <div className="mb-6 flex justify-between items-center no-print">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700"
                >
                    <Printer size={20} /> Print Report
                </button>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg border-t-8 border-nzema-red print:shadow-none print:border-none print:p-0">

                {/* Header Section */}
                <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-8">
                    <h1 className="text-3xl font-bold text-nzema-red tracking-tight">{COMPANY_NAME}</h1>
                    <h3 className="text-xl font-bold text-slate-800">{FORM_TITLE}</h3>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm">
                    <div className="border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-500 block text-xs uppercase">Vehicle Registration No.</span>
                        <span className="text-lg font-medium">{report.header.vehicleReg}</span>
                    </div>
                    <div className="border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-500 block text-xs uppercase">Date of Inspection</span>
                        <span className="text-lg font-medium">{report.header.date}</span>
                    </div>
                    <div className="border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-500 block text-xs uppercase">Road Worthiness Certificate</span>
                        <span className="text-lg font-medium">{report.header.roadWorthiness || 'N/A'}</span>
                    </div>
                    <div className="border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-500 block text-xs uppercase">Vehicle Insurance</span>
                        <span className="text-lg font-medium">{report.header.insurance || 'N/A'}</span>
                    </div>
                    <div className="border-b border-slate-200 pb-1 col-span-2">
                        <span className="font-bold text-slate-500 block text-xs uppercase">Inspected by</span>
                        <span className="text-lg font-medium">{report.inspectorName || 'N/A'}</span>
                    </div>
                </div>

                {/* SECTION A */}
                <div className="mb-8">
                    <h3 className="bg-slate-800 text-white p-2 font-bold text-sm uppercase mb-4 print:bg-slate-200 print:text-black">SECTION A — FIRE TENDER</h3>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100 print:bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left w-1/3">Item</th>
                                <th className="border border-slate-300 p-2 text-center w-16">Status</th>
                                <th className="border border-slate-300 p-2 text-left">Remarks / Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.sectionA.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="border border-slate-300 p-2 font-medium">{item.label}</td>
                                    <td className="border border-slate-300 p-2 text-center">
                                        {item.type === 'input' ? (
                                            <span className="text-xs font-bold text-slate-500">INPUT</span>
                                        ) : item.status === InspectionStatus.OK ? (
                                            <CheckCircle size={18} className="text-green-600 inline" />
                                        ) : (
                                            <XCircle size={18} className="text-red-600 inline" />
                                        )}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-slate-700">
                                        {item.type === 'input' ? (
                                            <span className="font-mono font-bold">{item.value}</span>
                                        ) : (
                                            item.remarks || '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* SECTION B */}
                <div className="mb-8">
                    <h3 className="bg-slate-800 text-white p-2 font-bold text-sm uppercase mb-4 print:bg-slate-200 print:text-black">SECTION B — PORTABLE FIRE PUMP</h3>
                    <table className="w-full text-sm border-collapse border border-slate-300">
                        <thead>
                            <tr className="bg-slate-100 print:bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left w-1/3">Item</th>
                                <th className="border border-slate-300 p-2 text-center w-16">Status</th>
                                <th className="border border-slate-300 p-2 text-left">Remarks / Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.sectionB.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="border border-slate-300 p-2 font-medium">{item.label}</td>
                                    <td className="border border-slate-300 p-2 text-center">
                                        {(item.type === 'input' || ['Pump Running time (Hour)', 'Delivery Pressure', 'Flow rate'].includes(item.label)) ? (
                                            <span className="text-xs font-bold text-slate-500">READING</span>
                                        ) : (item.status === InspectionStatus.OK || item.status === 'OK') ? (
                                            <CheckCircle size={18} className="text-green-600 inline" />
                                        ) : (item.status === InspectionStatus.DEFECTIVE || item.status === 'DEFECTIVE') ? (
                                            <XCircle size={18} className="text-red-600 inline" />
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="border border-slate-300 p-2 text-slate-700">
                                        {(item.type === 'input' || ['Pump Running time (Hour)', 'Delivery Pressure', 'Flow rate'].includes(item.label)) ? (
                                            <span className="font-mono font-bold">{item.value || '-'}</span>
                                        ) : (
                                            item.remarks || '-'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
