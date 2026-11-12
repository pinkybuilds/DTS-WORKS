
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

export type Organisation = {
  organisation_id: string;
  organisation_name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

type OrganisationContextType = {
  organisations: Organisation[];
  selectedOrganisation: Organisation | null;
  loading: boolean;
  error: string | null;
  selectOrganisation: (organisationId: string) => void;
  refreshOrganisations: () => Promise<void>;
};

const OrganisationContext =
  createContext<OrganisationContextType | undefined>(undefined);

const STORAGE_KEY = "dts_selected_organisation";

export function OrganisationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedOrganisation, setSelectedOrganisation] =
    useState<Organisation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganisations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Your session could not be verified. Please log in again.");
      }

      const apiUrl =
       process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

      const response = await fetch(
        `${apiUrl.replace(/\/$/, "")}/organisations`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve your organisations.");
      }

      const data: Organisation[] = await response.json();

      setOrganisations(data);

      const savedOrganisationId = localStorage.getItem(STORAGE_KEY);

      const savedOrganisation = data.find(
        (organisation) =>
          organisation.organisation_id === savedOrganisationId,
      );

      if (savedOrganisation) {
        setSelectedOrganisation(savedOrganisation);
      } else if (data.length === 1) {
        setSelectedOrganisation(data[0]);
        localStorage.setItem(
          STORAGE_KEY,
          data[0].organisation_id,
        );
      } else {
        setSelectedOrganisation(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      setSelectedOrganisation(null);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading your organisations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const selectOrganisation = useCallback(
    (organisationId: string) => {
      const organisation = organisations.find(
        (item) => item.organisation_id === organisationId,
      );

      if (!organisation) {
        return;
      }

      setSelectedOrganisation(organisation);
      localStorage.setItem(STORAGE_KEY, organisationId);
    },
    [organisations],
  );

  useEffect(() => {
    void refreshOrganisations();
  }, [refreshOrganisations]);

  return (
    <OrganisationContext.Provider
      value={{
        organisations,
        selectedOrganisation,
        loading,
        error,
        selectOrganisation,
        refreshOrganisations,
      }}
    >
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const context = useContext(OrganisationContext);

  if (!context) {
    throw new Error(
      "useOrganisation must be used inside an OrganisationProvider.",
    );
  }

  return context;
}
