import React, { useEffect, useState } from 'react'
import ProductCard from '../product/ProductCard'
import { useParams } from 'react-router-dom'
import { getStoreProducts } from '@/api/store.api';

const CategoryProducts = ({ products: providedProducts }) => {
    const {storeId} = useParams();
    const [fetchedProducts, setFetchedProducts] = useState([]);

    useEffect(() => {
        if (providedProducts) {
            return;
        }
        getStoreProducts(storeId).then(res => setFetchedProducts(res.data))
    }, [storeId, providedProducts]);

    const products = providedProducts || fetchedProducts;

    const grouped = products.reduce((acc, p) => {
        const key = p.category || "Other";
        acc[key] = acc[key] || [];
        acc[key].push(p);
        return acc;
    }, {});
  return (
    <div className='space-y-10'>
        {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
                <h4 className='font-semibold text-white mb-4'>{category}</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {items.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        ))}
    </div>
  )
}

export default CategoryProducts
