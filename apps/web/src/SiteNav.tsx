import { NavLink, Link } from 'react-router';
import { plain, site, ui } from './i18n.ts';
import { T } from './T.tsx';

/** The bar at the top of every page: the name (home) and the two tools. */
export function SiteNav() {
    return (
        <header className="site-nav">
            <div className="site-nav-inner">
                <Link to="/" className="site-brand" aria-label={plain(site.navHome)}>
                    <span className="site-logo" aria-hidden="true">
                        অ
                    </span>
                    <span lang="bn">{ui.appName.bn}</span>{' '}
                    <span className="site-brand-en">{ui.appName.en}</span>
                </Link>
                <nav aria-label="Main">
                    <NavLink to="/editor">
                        <T t={site.navBuild} />
                    </NavLink>
                    <NavLink to="/solve">
                        <T t={site.navSolve} />
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}
