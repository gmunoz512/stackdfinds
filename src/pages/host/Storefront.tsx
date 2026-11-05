import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy /storefront/:hostId links. The old page showed a hardcoded sample
 * host ("John Doe" / "Beach House Paradise") with mock experiences; the real
 * host guide lives at /guide/:hostId and loads the host's own picks.
 */
const HostStorefront = () => {
  const { hostId } = useParams();
  return <Navigate to={hostId ? `/guide/${hostId}` : "/appview"} replace />;
};

export default HostStorefront;
