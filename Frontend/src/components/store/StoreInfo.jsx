import React from 'react'
import { useOutletContext } from 'react-router-dom'

const StoreInfo = () => {
    const {store} = useOutletContext();
  return (
    <div className="mt-4 text-sm text-white/60">
        <p><b className="text-white">Address:</b> {store.address || "Not provided"}</p>
        <p className='mt-1'>
            <b className="text-white">City:</b> {store.city || "Not provided"}
        </p>
        <p className='mt-1'>
            <b className="text-white">Rating:</b> {store.average_rating || 0} / 5
        </p>
    </div>
  );
}

export default StoreInfo
