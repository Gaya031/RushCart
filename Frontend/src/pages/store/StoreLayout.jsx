import { getStoreDetails } from '@/api/store.api';
import StoreHeader from '@/components/store/StoreHeader';
import StoreTabs from '@/components/store/StoreTabs';
import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

const StoreLayout = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getStoreDetails(storeId)
            .then(res => setStore(res.data))
            .catch(() => setStore(null))
            .finally(() => setLoading(false));
    }, [storeId]);

    if (loading) return <p className='p-6 text-white/60'>Loading Store ...</p>;
    if (!store) return <p className='p-6 text-white/60'> Store not found</p>;
    return (
        <div className='min-h-screen rc-shell'>
            <Navbar />
            <StoreHeader store={store} />
            <StoreTabs />

            <div className='max-w-7xl mx-auto px-6 py-8'>
                <Outlet context={{ store }} />
            </div>
            <Footer />
        </div>
    );
}

export default StoreLayout
