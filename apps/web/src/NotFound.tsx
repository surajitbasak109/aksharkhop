import { Link } from 'react-router';
import { site } from './i18n.ts';
import { T } from './T.tsx';

export function NotFound() {
    return (
        <main className="page-narrow">
            <h1>
                <T t={site.notFoundTitle} />
            </h1>
            <p>
                <T t={site.notFoundHelp} />
            </p>
            <p>
                <Link className="button-link" to="/">
                    <T t={site.backHome} />
                </Link>
            </p>
        </main>
    );
}
