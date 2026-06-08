import DashboardGridLayout from '@/Components/FloodDashboard/DashboardGridLayout';
import IotLiveNotifications from '@/Components/FloodDashboard/IotLiveNotifications';
import { useIotApiHost } from '@/contexts/IotApiHostContext';
import { WIDGET_TYPE_OPTIONS_RINGKASAN } from '@/lib/dashboardWidgetDefaults';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { formatTimeWib } from '@/lib/wibTime';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Dashboard() {
    const page = usePage();
    const { baseUrl } = useIotApiHost();
    const { userLayout, layoutLocked } = page.props;
    const [dash, setDash] = useState(page.props.dashboard);
    const [lastSync, setLastSync] = useState(() => new Date());
    const [nowWib, setNowWib] = useState(() => new Date());

    const refresh = useCallback(async () => {
        const { data } = await axios.get(route('dashboard.dataset'));
        setDash(data);
        setLastSync(new Date());
    }, []);

    const prevIotBaseRef = useRef(baseUrl);
    useEffect(() => {
        if (prevIotBaseRef.current === baseUrl) {
            return;
        }
        prevIotBaseRef.current = baseUrl;
        refresh().catch(() => {});
    }, [baseUrl, refresh]);

    useEffect(() => {
        setDash(page.props.dashboard);
    }, [page.props.dashboard]);

    useEffect(() => {
        const id = window.setInterval(() => setNowWib(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    useEffect(() => {
        const id = window.setInterval(() => {
            refresh().catch(() => {});
        }, 20000);
        return () => window.clearInterval(id);
    }, [refresh]);

    useEffect(() => {
        const echo = window.Echo;
        if (!echo) {
            return undefined;
        }

        const channel = echo.channel('sensor-channel');
        const onSensorUpdated = () => {
            refresh().catch(() => {});
        };
        channel.listen('.sensor.updated', onSensorUpdated);

        return () => {
            channel.stopListening('.sensor.updated');
            echo.leave('sensor-channel');
        };
    }, [refresh]);

    return (
        <AuthenticatedLayout
            title=" Dashboard Flood Monitoring System"
            navbarTrailing={
                <>
                    <span className="hidden flex-wrap items-baseline gap-x-1 text-xs text-slate-400 sm:inline-flex sm:text-sm">
                        <span className="font-medium tabular-nums text-white">
                            WIB {formatTimeWib(nowWib, { timeStyle: 'medium' })}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span>
                            Data:{' '}
                            {formatTimeWib(lastSync, { timeStyle: 'medium' })}
                        </span>
                    </span>
                    <span className="text-xs tabular-nums text-slate-400 sm:hidden">
                        WIB {formatTimeWib(nowWib, { timeStyle: 'short' })}
                    </span>
                    <button
                        type="button"
                        onClick={() => refresh().catch(() => {})}
                        className="whitespace-nowrap rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-slate-700 sm:px-3"
                    >
                        <span className="sm:hidden">Refresh</span>
                        <span className="hidden sm:inline">Refresh data</span>
                    </button>
                </>
            }
        >
            <Head title="Dashboard Flood Monitoring System" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="px-4 sm:px-0">
                        <IotLiveNotifications iotConnectivity={dash.iot_connectivity} />
                    </div>

                    <div className="px-4 sm:px-0">
                        <DashboardGridLayout
                            userLayout={userLayout}
                            layoutLocked={Boolean(layoutLocked)}
                            dash={dash}
                            onCommandSent={refresh}
                            layoutName="default"
                            widgetTypeOptions={WIDGET_TYPE_OPTIONS_RINGKASAN}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
