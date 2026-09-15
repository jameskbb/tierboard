import { Toaster } from '@/components/ui/Toaster';
import { useApplyColorScheme } from '@/hooks/useColorScheme';
import { useRoute } from '@/lib/router';
import { BoardPage } from '@/pages/BoardPage';
import { HomePage } from '@/pages/HomePage';
import { SharedPage } from '@/pages/SharedPage';
import { useUiStore } from '@/stores/uiStore';

export function App() {
  const route = useRoute();
  const presenting = useUiStore((state) => state.presenting);
  // Presentation always uses the dark stage.
  useApplyColorScheme(presenting && route.name !== 'home');

  return (
    <>
      {route.name === 'home' && <HomePage />}
      {route.name === 'board' && (
        <BoardPage key={route.id} boardId={route.id} intent={route.intent} />
      )}
      {route.name === 'shared' && <SharedPage key={route.payload} payload={route.payload} />}
      <Toaster />
    </>
  );
}
