import { useCallback, useEffect, useState } from "react";
import {
  clearDatabaseConnectionSettings,
  fetchDatabaseConnectionSettings,
  testDatabaseConnectionSettings,
  updateDatabaseConnectionSettings,
  type DatabaseConnectionSettings,
  type DatabaseMode,
  type UpdateDatabaseConnectionPayload,
  type UserProfile,
} from "../services/chatApi";

interface DatabaseFeedback {
  status: "success" | "error";
  message: string;
}

interface UseDatabaseSettingsOptions {
  currentUser: UserProfile | null;
  deriveErrorMessage: (error: unknown, fallback: string) => string;
}

const useDatabaseSettings = ({ currentUser, deriveErrorMessage }: UseDatabaseSettingsOptions) => {
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);
  const [databaseSettings, setDatabaseSettings] = useState<DatabaseConnectionSettings | null>(null);
  const [databaseModes, setDatabaseModes] = useState<DatabaseMode[]>([]);
  const [environmentFallback, setEnvironmentFallback] = useState<DatabaseConnectionSettings | null>(null);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(false);
  const [isDatabaseBusy, setIsDatabaseBusy] = useState(false);
  const [databaseFeedback, setDatabaseFeedback] = useState<DatabaseFeedback | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setDatabaseSettings(null);
      setDatabaseModes([]);
      setEnvironmentFallback(null);
      setIsDatabaseLoading(false);
      return;
    }

    setIsDatabaseLoading(true);
    (async () => {
      try {
        const result = await fetchDatabaseConnectionSettings();
        setDatabaseSettings(result.connection);
        setDatabaseModes(result.availableModes);
        setEnvironmentFallback(result.environmentFallback ?? null);
      } catch (error) {
        console.error("Failed to load database settings", error);
      } finally {
        setIsDatabaseLoading(false);
      }
    })();
  }, [currentUser]);

  const openDatabaseSettings = useCallback(async () => {
    setDatabaseFeedback(null);
    setDatabaseModalOpen(true);
    setIsDatabaseLoading(true);

    try {
      const result = await fetchDatabaseConnectionSettings();
      setDatabaseSettings(result.connection);
      setDatabaseModes(result.availableModes);
      setEnvironmentFallback(result.environmentFallback ?? null);
    } catch (error) {
      setDatabaseFeedback({
        status: "error",
        message: deriveErrorMessage(error, "Unable to load database settings."),
      });
    } finally {
      setIsDatabaseLoading(false);
    }
  }, [deriveErrorMessage]);

  const closeDatabaseModal = useCallback(() => {
    setDatabaseModalOpen(false);
    setDatabaseFeedback(null);
  }, []);

  const saveDatabaseSettings = useCallback(
    async (payload: UpdateDatabaseConnectionPayload): Promise<boolean> => {
      setIsDatabaseBusy(true);
      setDatabaseFeedback(null);

      try {
        const result = await updateDatabaseConnectionSettings(payload);
        setDatabaseSettings(result.connection);
        setDatabaseModes(result.availableModes);
        setEnvironmentFallback(result.environmentFallback ?? null);
        const successMessage = payload.testConnection
          ? "Database connection saved and verified."
          : "Database connection updated.";
        setDatabaseFeedback({ status: "success", message: successMessage });
        return true;
      } catch (error) {
        setDatabaseFeedback({
          status: "error",
          message: deriveErrorMessage(error, "Unable to save database configuration."),
        });
        return false;
      } finally {
        setIsDatabaseBusy(false);
      }
    },
    [deriveErrorMessage]
  );

  const testDatabaseSettings = useCallback(
    async (payload: UpdateDatabaseConnectionPayload): Promise<boolean> => {
      setIsDatabaseBusy(true);
      setDatabaseFeedback(null);

      try {
        const result = await testDatabaseConnectionSettings(payload);
        setDatabaseFeedback({
          status: result.ok ? "success" : "error",
          message: result.message,
        });
        return result.ok;
      } catch (error) {
        setDatabaseFeedback({
          status: "error",
          message: deriveErrorMessage(error, "Unable to test database connection."),
        });
        return false;
      } finally {
        setIsDatabaseBusy(false);
      }
    },
    [deriveErrorMessage]
  );

  const disconnectDatabase = useCallback(async (): Promise<boolean> => {
    setIsDatabaseBusy(true);
    setDatabaseFeedback(null);

    try {
      const result = await clearDatabaseConnectionSettings();
      setDatabaseSettings(result.connection);
      setDatabaseModes(result.availableModes);
      setEnvironmentFallback(result.environmentFallback ?? null);
      setDatabaseFeedback({
        status: "success",
        message: "Database connection removed. Configure a new source to run SQL queries.",
      });
      return true;
    } catch (error) {
      setDatabaseFeedback({
        status: "error",
        message: deriveErrorMessage(error, "Unable to reset database configuration."),
      });
      return false;
    } finally {
      setIsDatabaseBusy(false);
    }
  }, [deriveErrorMessage]);

  return {
    databaseModalOpen,
    databaseSettings,
    databaseModes,
    environmentFallback,
    isDatabaseLoading,
    isDatabaseBusy,
    databaseFeedback,
    openDatabaseSettings,
    closeDatabaseModal,
    saveDatabaseSettings,
    testDatabaseSettings,
    disconnectDatabase,
    setDatabaseModalOpen,
    setDatabaseFeedback,
    setDatabaseSettings,
    setDatabaseModes,
    setEnvironmentFallback,
  };
};

export default useDatabaseSettings;
