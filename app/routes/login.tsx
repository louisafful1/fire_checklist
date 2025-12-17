import { useState, useEffect } from 'react';
import { Form, redirect, useActionData, useNavigate } from 'react-router';
import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { LogIn } from 'lucide-react';
import logoblack from "../utils/logo-black.jpg"
import toast from 'react-hot-toast';
import { User } from '../db/models/User';
import { connectDB } from '../db/connect';
import { getSession, commitSession } from '../utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    if (session.has("userId")) {
        return redirect("/dashboard");
    }
    return null;
}

export async function action({ request }: ActionFunctionArgs) {
    await connectDB();
    const formData = await request.formData();
    const name = formData.get('name') as string;

    if (!name || name.trim() === '') {
        return { error: 'Please enter your name' };
    }

    try {
        let user = await User.findOne({ name });
        if (!user) {
            user = new User({ name, role: 'inspector' });
            await user.save();
        }

        const session = await getSession(request.headers.get("Cookie"));
        session.set("userId", user._id.toString());

        return redirect('/dashboard', {
            headers: {
                "Set-Cookie": await commitSession(session),
            },
        });
    } catch (error) {
        console.error(error);
        return { error: 'Login failed. Please try again.' };
    }
}

export default function Login() {
    const actionData = useActionData() as { error?: string } | undefined;
    const [name, setName] = useState('');

    useEffect(() => {
        if (actionData?.error) {
            toast.error(actionData.error);
        }
    }, [actionData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-nzema-red flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border-t-8 border-gold-500">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <img src={logoblack} alt="Adamus Logo" className="w-20" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Fire Truck Checklist
                        </h1>
                        <p className="text-slate-500">Sign in to continue</p>
                    </div>

                    {/* Login Form using React Router Form */}
                    <Form method="post" className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                                Inspector Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-gold-500 focus:ring-4 focus:ring-gold-100 outline-none transition-all"
                                placeholder="Enter your name"
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-nzema-red to-red-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <LogIn size={24} />
                            Sign In
                        </button>
                    </Form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-slate-500">
                        <p>Fire Safety Inspection System</p>
                        <p className="mt-1">© 2025 Adamus Resources</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
