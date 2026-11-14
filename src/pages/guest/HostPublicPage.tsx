import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { VendorPhoto } from "@/components/destination/VendorPhoto";
import { findAirbnbExperienceById } from "@/data/airbnbCatalog";
import { mockRestaurants } from "@/data/mockRestaurants";
import { stackd } from "@/integrations/stackd/client";
import { guestPriceLine } from "@/lib/experiencePrice";
import { splitTopPicks } from "@/lib/hostGuide";
import { hostPageItemPath, type HostPageItemType } from "@/lib/hostPage";

interface PageRow {
  host_id: string;
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
}

interface ItemRow {
  item_type: HostPageItemType;
  item_ref: string;
  vendor_username: string | null;
  position: number;
}

interface Tile {
  key: string;
  title: string;
  photo: string | null;
  href: string;
  bookHref: string | null;
  kind: HostPageItemType;
  price: string | null;
}

function tileFor(item: ItemRow, hostId: string): Tile | null {
  const href = hostPageItemPath(
    { itemType: item.item_type, itemRef: item.item_ref, vendorUsername: item.vendor_username },
    hostId,
  );
  if (!href) return null;
  if (item.item_type === "experience") {
    const experience = findAirbnbExperienceById(item.item_ref);
    if (!experience || experience.username !== item.vendor_username) return null;
    return {
      key: `experience:${item.item_ref}`,
      title: experience.title,
      photo: experience.photos[0] ?? null,
      href,
      bookHref: `${href}#book`,
      kind: "experience",
      price: guestPriceLine(experience.price),
    };
  }
  const restaurant = mockRestaurants.find((row) => row.id === item.item_ref);
  if (!restaurant) return null;
  return {
    key: `restaurant:${item.item_ref}`,
    title: restaurant.name,
    photo: restaurant.photos[0] ?? null,
    href,
    bookHref: null,
    kind: "restaurant",
    price: null,
  };
}

function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <ol className="host-top">
      {tiles.map((tile) => (
        <li key={tile.key} className="guide-photo-tile host-tile">
          <Link to={tile.href} className="guide-photo-link">
            <VendorPhoto src={tile.photo} name={tile.title} frameClassName="host-tile-photo" />
            <span className="host-tile-title">{tile.title}</span>
          </Link>
          {tile.bookHref ? (
            <Link className="experience-book" to={tile.bookHref}>Request to book</Link>
          ) : (
            <p className="host-recommendation">Recommendation</p>
          )}
          {tile.price ? <p className="listing-price">{tile.price}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export default function HostPublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageRow | null | undefined>(undefined);
  const [tiles, setTiles] = useState<Tile[]>([]);

  useEffect(() => {
    if (!stackd || !slug) {
      setPage(null);
      return;
    }
    let live = true;
    void (async () => {
      const { data } = await stackd.from("host_pages").select("host_id, slug, display_name, bio, photo_url").eq("slug", slug).maybeSingle();
      if (!live) return;
      if (!data) {
        setPage(null);
        return;
      }
      const row = data as PageRow;
      setPage(row);
      const { data: items } = await stackd
        .from("host_page_items")
        .select("item_type, item_ref, vendor_username, position")
        .eq("host_id", row.host_id)
        .order("position", { ascending: true });
      if (!live) return;
      setTiles(((items ?? []) as ItemRow[]).map((item) => tileFor(item, row.host_id)).filter((item): item is Tile => item !== null));
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (!stackd) {
    return (
      <div className="reference-catalog experiences-light">
        <div className="reference-empty">
          <p>Host pages opening soon.</p>
          <Link to="/experiences">All experiences</Link>
        </div>
      </div>
    );
  }

  if (page === undefined) {
    return <div className="reference-catalog experiences-light"><p className="catalog-count">Loading…</p></div>;
  }

  if (!page) {
    return (
      <div className="reference-catalog experiences-light">
        <div className="reference-empty">
          <p>That page isn’t available.</p>
          <Link to="/experiences">All experiences</Link>
        </div>
      </div>
    );
  }

  const { top, more } = splitTopPicks(tiles);

  return (
    <article className="reference-detail experiences-light host-page">
      <p className="listing-category">Local guide</p>
      <VendorPhoto src={page.photo_url} name={page.display_name} frameClassName="vendor-hero" loading="eager" />
      <h1>{page.display_name}</h1>
      {page.bio ? <p className="host-bio">{page.bio}</p> : null}
      {top.length === 0 ? <p className="catalog-count">This page doesn’t have picks yet.</p> : null}
      {top.length > 0 ? (
        <section aria-label="Top picks">
          <h2>Top {top.length}</h2>
          <TileGrid tiles={top} />
        </section>
      ) : null}
      {more.length > 0 ? (
        <section aria-label="More picks">
          <h2>More</h2>
          <TileGrid tiles={more} />
        </section>
      ) : null}
    </article>
  );
}
