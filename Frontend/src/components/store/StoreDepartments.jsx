
import { getStoreProducts } from '@/api/store.api';
import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const StoreDepartments = () => {
  const { storeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const selected = searchParams.get("dept") || "all";

  useEffect(() => {
    getStoreProducts(storeId).then(res => {
      const cats = new Set((res.data || []).map(p => p.category).filter(Boolean));
      setCategories(["all", ...cats]);
    })
  }, [storeId]);

  const pickCategory = (cat) => {
    const next = new URLSearchParams(searchParams);
    if (cat === "all") next.delete("dept");
    else next.set("dept", cat);
    setSearchParams(next);
  };

  return (
    <div className='mt-6'>
      <h4 className='font-semibold mb-3 text-white'>Departments</h4>
      <ul className='space-y-2 text-sm text-white/60'>
        {categories.map(cat => (
          <li
            key={cat}
            className={`cursor-pointer transition ${
              selected === cat ? "text-amber-200 font-semibold" : "hover:text-white"
            }`}
            onClick={() => pickCategory(cat)}
          >
            {cat === "all" ? "All Departments" : cat}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StoreDepartments
