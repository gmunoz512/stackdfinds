import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { GoogleRating } from '@/components/GoogleRating';
import { resolveGoogleRating } from '@/lib/googleRating';

interface MeetTheHostProps {
  name: string;
  category: string;
  bio: string | null;
  avatarUrl: string | null;
  googleRating: number | null;
}

const MeetTheHost = ({ name, category, bio, avatarUrl, googleRating }: MeetTheHostProps) => {
  const [bioExpanded, setBioExpanded] = useState(false);

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <h2 className="text-[22px] font-semibold">Meet your host</h2>

      <div className="rounded-2xl border border-border bg-card p-6">
        {/* Host card top */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={name} />
            ) : null}
            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-hot to-rose text-paper">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-[18px] font-semibold truncate">{name}</h3>
            <p className="text-[14px] text-muted-foreground">{category}</p>
            <div className="mt-1">
              <GoogleRating
                value={resolveGoogleRating({ googleRating })}
                showCount={false}
                className="text-[13px]"
                starClassName="h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="mt-4">
            <p className={`text-[15px] leading-relaxed text-foreground whitespace-pre-wrap ${!bioExpanded ? 'line-clamp-4' : ''}`}>
              {bio}
            </p>
            {bio.length > 180 && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="text-[15px] font-semibold underline underline-offset-4 mt-2 hover:text-foreground/80 transition-colors"
              >
                {bioExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {!bio && (
          <p className="mt-4 text-[14px] text-muted-foreground italic">
            This host hasn't added a bio yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default MeetTheHost;
