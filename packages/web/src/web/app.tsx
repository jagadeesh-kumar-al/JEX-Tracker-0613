import { Route, Switch } from "wouter";
import Index from "./pages/index";
import Transactions from "./pages/transactions";
import Analytics from "./pages/analytics";
import Preferences from "./pages/preferences";
import { Provider } from "./components/provider";
import { Shell } from "./components/shell";
import { AuthGate } from "./components/auth-gate";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

function App() {
  return (
    <Provider>
      <AuthGate>
        <Shell>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/preferences" component={Preferences} />
          </Switch>
        </Shell>
      </AuthGate>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
