// The pages of the site and their addresses:
//   /              the landing page
//   /editor        build a crossword
//   /solve         open a crossword to solve (a link, a file, or the sample)
//   /solve#solve=… a shared crossword
//   /solve/sample  the built-in sample
import { useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router';
import { App } from './App.tsx';
import { plain, site } from './i18n.ts';
import { Landing } from './Landing.tsx';
import { NotFound } from './NotFound.tsx';
import { SiteNav } from './SiteNav.tsx';
import { SamplePage, SolvePage } from './SolvePage.tsx';

/** Every page: the site bar, then the page. A new page starts at the top. */
function Layout() {
    const { pathname } = useLocation();
    useEffect(() => window.scrollTo(0, 0), [pathname]);
    return (
        <>
            <SiteNav />
            <Outlet />
        </>
    );
}

function Editor() {
    useEffect(() => {
        document.title = plain(site.pageTitleEditor);
    }, []);
    return <App />;
}

export function Root() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="editor" element={<Editor />} />
                <Route path="solve" element={<SolvePage />} />
                <Route path="solve/sample" element={<SamplePage />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
