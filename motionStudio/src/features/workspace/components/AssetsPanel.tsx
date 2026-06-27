import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Music, Upload } from 'lucide-react';

const TABS = [
  { value: 'images', label: 'Images', icon: Image },
  { value: 'videos', label: 'Videos', icon: Video },
  { value: 'audio',  label: 'Audio',  icon: Music },
  { value: 'upload', label: 'Upload', icon: Upload },
] as const;

export default function AssetsPanel() {
  return (
    <div className="flex flex-col h-full bg-studio-panel overflow-hidden">
      <div className="px-4 h-9 flex items-center border-b border-studio-border shrink-0">
        <span className="text-[11px] font-semibold text-studio-text-faint uppercase tracking-widest">
          Assets
        </span>
      </div>

      <Tabs defaultValue="images" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-3 mt-3 mb-0 grid grid-cols-4 h-7 bg-studio-surface rounded-studio-sm p-0.5 gap-0.5 shrink-0">
          {TABS.map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              title={label}
              className="h-full rounded-[4px] text-studio-text-faint data-[state=active]:bg-studio-overlay data-[state=active]:text-studio-text px-0"
            >
              <Icon className="w-3.5 h-3.5" />
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(({ value, label }) => (
          <TabsContent
            key={value}
            value={value}
            className="flex-1 flex flex-col items-center justify-center mt-0 px-4 gap-2"
          >
            <p className="text-[12px] text-studio-text-faint text-center">
              {label} will appear here
            </p>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
