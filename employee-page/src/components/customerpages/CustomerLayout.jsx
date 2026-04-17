import React from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'
import Footer from './Footer'

function CustomerLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col">
        <Navbar />
        <main className="flex-1">
            <Outlet />
        </main>
        <Footer />
    </div>
  )
}

export default CustomerLayout
