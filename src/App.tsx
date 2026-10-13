import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import AppRouter from "./router/AppRouter";
import { UserDataProvider } from "./context/UserDataProvider";

const App = () => {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));

  return (
    <QueryClientProvider client={queryClient}>
      <UserDataProvider>
        <ErrorBoundary><AppRouter /></ErrorBoundary>
      </UserDataProvider>
    </QueryClientProvider>
  );
};

export default App;
