import { Link } from 'react-router-dom';

export function NotFound() {
	return (
		<div>
			<h1>Page not found</h1>
			<p>The page you are looking for does not exist.</p>
			<p>
				<Link className="button" to="/">Return to Overview</Link>
			</p>
		</div>
	);
}


