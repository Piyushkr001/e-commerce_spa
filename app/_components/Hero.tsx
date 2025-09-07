'use client'

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default function Hero() {
    return (
        <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-stone-900 dark:via-stone-800 dark:to-stone-700">
            <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-10 px-6 py-20">

                {/* Left side: Content */}
                <div className="flex-1 flex flex-col items-start text-left space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                        Welcome to <span className="text-blue-600 dark:text-blue-400">Bazario</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-700 dark:text-slate-200 max-w-xl">
                        Discover amazing products at unbeatable prices. Shop smarter, faster, and safer — all in one place.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-4 mt-4">
                        <Link href='/shopping'>
                            <Button size="lg" className="px-6 py-3 cursor-pointer rounded-xl">
                                Start Shopping
                            </Button>
                        </Link>
                        <Link href='/learn-more'>
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-6 py-3 cursor-pointer rounded-xl border-2"
                            >
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right side: Hero Image */}
                <div className="flex-1 flex justify-center md:justify-end">
                    <Image
                        src="/Images/Hero_Image.png"
                        alt="Shopping illustration"
                        width={500}
                        height={500}
                        className="w-full max-w-md md:max-w-lg rounded-2xl object-contain drop-shadow-xl"
                        priority
                    />
                </div>
            </div>
        </section>
    )
}
