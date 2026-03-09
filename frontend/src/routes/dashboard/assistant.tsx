import { createFileRoute } from '@tanstack/react-router';
import { AssistantPage } from '../../components/AssistantPage';

function AssistantRoute() {
  return <AssistantPage />;
}

export const Route = createFileRoute('/dashboard/assistant')({
  head: () => ({
    meta: [{ title: 'AI Assistant – CivicRise' }],
  }),
  component: AssistantRoute,
});
