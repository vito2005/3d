"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

const id = 106290340;
export default function Metrika() {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const pathName = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = searchParams.toString();
        const url = base + pathName + (params && "?" + params);

        if (typeof window !== 'undefined' && (window as any).ym) {
            (window as any).ym(id, "hit", url);
        }
    }, [pathName, searchParams, base]);

    return (
        <>
            <Script id="metrika" type="text/javascript">
                {`(function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${id}', 'ym');

    ym(${id}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", accurateTrackBounce:true, trackLinks:true, defer: true});
    `}
            </Script>
            <noscript><div><img src={`https://mc.yandex.ru/watch/${id}`} style={{ position: 'absolute', left: '-9999px' }} alt="" /></div></noscript>
        </>
    )
}