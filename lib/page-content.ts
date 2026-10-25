import "server-only";
import { cache } from "react";
import { getPublicCMSState } from "./cms";
export const getSitePages = cache(async () => (await getPublicCMSState("page")).documents);
