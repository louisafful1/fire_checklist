import { useLoaderData, Link } from "react-router";
import { useState } from 'react';
import type { LoaderFunctionArgs } from "react-router";
import { format } from 'date-fns';
import { FileText, Plus, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Inspection } from '../db/models/Inspection';
import { connectDB } from '../db/connect';
import { requireUserId } from '../utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
    await requireUserId(request); // Ensure protected
    await connectDB();
    const inspections = await Inspection.find().sort({ createdAt: -1 });
    // Mongoose documents need to be serialized. simple JSON stringify/parse or mapping.
    // RRv7 handles JSON response if generic, but helper might be better if we have methods.
    // toJSON() usually works.
    return { inspections: JSON.parse(JSON.stringify(inspections)) };
}

export default function Dashboard() {
    const { inspections } = useLoaderData() as { inspections: any[] };
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInspections = inspections.filter(inspection => {
        const matchesSearch =
            (inspection.header?.vehicleReg?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (inspection.inspectorName?.toLowerCase().includes(searchTerm.toLowerCase()) || '');

        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, Inspector</p>
                </div>
                <Link
                    to="/inspection/new"
                    className="bg-nzema-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                    <Plus size={20} />
                    New Inspection
                </Link>
            </div>

            {/* Stats Cards (Simplified for migration, can be enhanced with real data stats) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-nzema-red">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Inspections</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-1">{filteredInspections.length}</h3>
                        </div>
                        <div className="p-2 bg-red-100 rounded-lg text-nzema-red">
                            <FileText size={20} />
                        </div>
                    </div>
                </div>
                {/* ... Add other stats if in original ... */}
            </div>

            {/* Inspections List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white sticky top-20 z-30">
                    <h2 className="text-lg font-bold text-slate-800">Recent Inspections</h2>
                    <div className="relative w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search inspections..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-nzema-red focus:ring-1 focus:ring-nzema-red text-sm w-full md:w-64"
                        />
                    </div>
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto bg-white">
                    <table className="w-full">
                        <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
                            <tr>
                                <th className="px-6 py-4 text-left">Vehicle Reg</th>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Inspector</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInspections.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No inspections found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredInspections.map((inspection) => (
                                    <tr key={inspection._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{inspection.header?.vehicleReg || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar size={16} />
                                                {format(new Date(inspection.createdAt), 'MMM d, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{inspection.inspectorName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${!inspection.isCompleted ? 'bg-yellow-100 text-yellow-700' :
                                                (inspection.sectionA?.some((i: any) => i.status === 'DEFECTIVE') || inspection.sectionB?.some((i: any) => i.status === 'DEFECTIVE'))
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {!inspection.isCompleted ? (
                                                    <>
                                                        <AlertCircle size={12} /> Draft
                                                    </>
                                                ) : (inspection.sectionA?.some((i: any) => i.status === 'DEFECTIVE') || inspection.sectionB?.some((i: any) => i.status === 'DEFECTIVE')) ? (
                                                    <>
                                                        <AlertCircle size={12} /> Defect Found
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle size={12} /> No Defect
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/inspection/${inspection._id}`}
                                                className="text-nzema-red hover:text-red-700 font-medium text-sm"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden space-y-4">
                    {filteredInspections.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-white rounded-lg shadow-sm">
                            No inspections found matching your filters.
                        </div>
                    ) : (
                        filteredInspections.map((inspection) => (
                            <div key={inspection._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                                        <Calendar size={16} />
                                        {format(new Date(inspection.createdAt), 'MMM d, yyyy')}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${!inspection.isCompleted ? 'bg-yellow-100 text-yellow-700' :
                                        (inspection.sectionA?.some((i: any) => i.status === 'DEFECTIVE') || inspection.sectionB?.some((i: any) => i.status === 'DEFECTIVE'))
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {!inspection.isCompleted ? (
                                            <>
                                                <AlertCircle size={12} /> Draft
                                            </>
                                        ) : (inspection.sectionA?.some((i: any) => i.status === 'DEFECTIVE') || inspection.sectionB?.some((i: any) => i.status === 'DEFECTIVE')) ? (
                                            <>
                                                <AlertCircle size={12} /> Defect Found
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={12} /> No Defect
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <span className="font-medium text-slate-500">Inspector:</span>
                                    <span className="text-slate-800 font-medium">{inspection.inspectorName}</span>
                                </div>

                                <div className="pt-1">
                                    <Link
                                        to={`/inspection/${inspection._id}`}
                                        className="block w-full text-center bg-nzema-red hover:bg-red-700 text-white font-medium py-2.5 rounded-lg text-sm shadow-sm transition-all active:scale-[0.98]"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
