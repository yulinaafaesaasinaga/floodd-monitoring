import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        device_id: '',
        name: '',
        location: '',
        status: 'offline',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('monitoring.devices.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-white">Tambah perangkat</h2>
                    <Link
                        href={route('monitoring.devices.index')}
                        className="text-sm text-amber-300 hover:text-amber-200"
                    >
                        ← Kembali ke daftar
                    </Link>
                </div>
            }
        >
            <Head title="Tambah perangkat" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form
                        onSubmit={submit}
                        className="space-y-6 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-sm"
                    >
                        <div>
                            <InputLabel htmlFor="device_id" value="Device ID" className="text-slate-300" />
                            <TextInput
                                id="device_id"
                                className="mt-1 block w-full border-slate-600 bg-slate-950 text-white"
                                value={data.device_id}
                                onChange={(e) => setData('device_id', e.target.value)}
                                required
                            />
                            <InputError message={errors.device_id} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="name" value="Nama" className="text-slate-300" />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full border-slate-600 bg-slate-950 text-white"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="location" value="Lokasi" className="text-slate-300" />
                            <TextInput
                                id="location"
                                className="mt-1 block w-full border-slate-600 bg-slate-950 text-white"
                                value={data.location}
                                onChange={(e) => setData('location', e.target.value)}
                                required
                            />
                            <InputError message={errors.location} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Status" className="text-slate-300" />
                            <select
                                id="status"
                                className="mt-1 block w-full rounded-md border-slate-600 bg-slate-950 text-white shadow-sm focus:border-amber-500 focus:ring-amber-500"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                            >
                                <option value="offline">Offline</option>
                                <option value="online">Online</option>
                            </select>
                            <InputError message={errors.status} className="mt-2" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Link
                                href={route('monitoring.devices.index')}
                                className="inline-flex items-center rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700"
                            >
                                Batal
                            </Link>
                            <PrimaryButton disabled={processing}>Simpan</PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
