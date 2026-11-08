/* SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 * Copyright (c) 2026 Yassine Chettouch
 */

// Definition of images used in the application.
import ABetterWorld from '@public/illustrations/document.svg';
import AccessDenied from '@public/illustrations/document.svg';
import AddDocument from '@public/illustrations/document.svg';
import AddFiles from '@public/illustrations/document.svg';
import AddNotes from '@public/illustrations/document.svg';
import Adventure from '@public/illustrations/document.svg';
import Alert from '@public/illustrations/document.svg';
import AttachedFile from '@public/illustrations/document.svg';
import BookReading from '@public/illustrations/document.svg';
import BugFixing from '@public/illustrations/document.svg';
import Cancel from '@public/illustrations/document.svg';
import CloudDocs from '@public/illustrations/document.svg';
import CoWorking from '@public/illustrations/document.svg';
import ConnectedWorld from '@public/illustrations/document.svg';
import Discount from '@public/illustrations/document.svg';
import Dreamer from '@public/illustrations/document.svg';
import Empty from '@public/illustrations/document.svg';
import Engineers from '@public/illustrations/document.svg';
import FilingSystem from '@public/illustrations/document.svg';
import Folder from '@public/illustrations/document.svg';
import GoingOffline from '@public/illustrations/document.svg';
import InternetOnTheGo from '@public/illustrations/document.svg';
import IntoTheNight from '@public/illustrations/document.svg';
import LightTheFire from '@public/illustrations/document.svg';
import Lighthouse from '@public/illustrations/document.svg';
import Loading from '@public/illustrations/document.svg';
import Login from '@public/illustrations/document.svg';
import MyDocuments from '@public/illustrations/document.svg';
import NoData from '@public/illustrations/document.svg';
import NotFound from '@public/illustrations/document.svg';
import PageNotFound from '@public/illustrations/document.svg';
import PersonalDocuments from '@public/illustrations/document.svg';
import Polaroid from '@public/illustrations/document.svg';
import RelaunchDay from '@public/illustrations/document.svg';
import Searching from '@public/illustrations/document.svg';
import SecureLogin from '@public/illustrations/document.svg';
import SecurityOn from '@public/illustrations/document.svg';
import ServerDown from '@public/illustrations/document.svg';
import SignUp from '@public/illustrations/document.svg';
import StarryWindow from '@public/illustrations/document.svg';
import Surveillance from '@public/illustrations/document.svg';
import Taken from '@public/illustrations/document.svg';
import TwoFactorAuthentication from '@public/illustrations/document.svg';
import Unlock from '@public/illustrations/document.svg';
import Void from '@public/illustrations/document.svg';
import Warning from '@public/illustrations/document.svg';
import Welcome from '@public/illustrations/document.svg';
import WorkingLate from '@public/illustrations/document.svg';
import type { StaticImageData } from 'next/image';

/** Next.js Static Image Data Type. */

/** Object to store images with descriptive keys. */
export const IMAGES: Record<string, StaticImageData> = {
    ACCESS_DENIED: AccessDenied,
    ADD_DOCUMENT: AddDocument,
    ADD_FILES: AddFiles,
    ADD_NOTES: AddNotes,
    ADVENTURE: Adventure,
    ALERT: Alert,
    ATTACHED_FILE: AttachedFile,
    A_BETTER_WORLD: ABetterWorld,
    BOOK_READING: BookReading,
    BUG_FIXING: BugFixing,
    CANCEL: Cancel,
    CLOUD_DOCS: CloudDocs,
    CONNECTED_WORLD: ConnectedWorld,
    CO_WORKING: CoWorking,
    DISCOUNT: Discount,
    DREAMER: Dreamer,
    EMPTY: Empty,
    ENGINEERS: Engineers,
    FILING_SYSTEM: FilingSystem,
    FOLDER: Folder,
    GOING_OFFLINE: GoingOffline,
    INTERNET_ON_THE_GO: InternetOnTheGo,
    INTO_THE_NIGHT: IntoTheNight,
    LIGHTHOUSE: Lighthouse,
    LIGHT_THE_FIRE: LightTheFire,
    LOADING: Loading,
    LOGIN: Login,
    MY_DOCUMENTS: MyDocuments,
    NOT_FOUND: NotFound,
    NO_DATA: NoData,
    PAGE_NOT_FOUND: PageNotFound,
    PERSONAL_DOCUMENTS: PersonalDocuments,
    POLAROID: Polaroid,
    RELAUNCH_DAY: RelaunchDay,
    SEARCHING: Searching,
    SECURE_LOGIN: SecureLogin,
    SECURITY_ON: SecurityOn,
    SERVER_DOWN: ServerDown,
    SIGN_UP: SignUp,
    STARRY_WINDOW: StarryWindow,
    SURVEILLANCE: Surveillance,
    TAKEN: Taken,
    TWO_FACTOR_AUTHENTICATION: TwoFactorAuthentication,
    UNLOCK: Unlock,
    VOID: Void,
    WARNING: Warning,
    WELCOME: Welcome,
    WORKING_LATE: WorkingLate,
};

/** Images used for error states. */
export const ERROR_STATE_IMAGES: StaticImageData[] = [
    IMAGES.ACCESS_DENIED,
    IMAGES.ALERT,
    IMAGES.NOT_FOUND,
    IMAGES.PAGE_NOT_FOUND,
    IMAGES.SERVER_DOWN,
    IMAGES.WARNING,
];

/** Images used for empty table states. */
export const EMPTY_TABLE_IMAGES: StaticImageData[] = [
    IMAGES.ADD_DOCUMENT,
    IMAGES.ADD_FILES,
    IMAGES.ADD_NOTES,
    IMAGES.ADVENTURE,
    IMAGES.BOOK_READING,
    IMAGES.CLOUD_DOCS,
    IMAGES.DREAMER,
    IMAGES.FILING_SYSTEM,
    IMAGES.FOLDER,
    IMAGES.MY_DOCUMENTS,
    IMAGES.PERSONAL_DOCUMENTS,
    IMAGES.POLAROID,
    IMAGES.STARRY_WINDOW,
    IMAGES.WELCOME,
    IMAGES.WORKING_LATE,
    IMAGES.EMPTY,
    IMAGES.NO_DATA,
];

/** Images used for empty queried table states. */
export const EMPTY_QUERIED_TABLE_IMAGES: StaticImageData[] = [
    IMAGES.ADD_DOCUMENT,
    IMAGES.ADD_FILES,
    IMAGES.ADD_NOTES,
    IMAGES.ADVENTURE,
    IMAGES.BOOK_READING,
    IMAGES.SEARCHING,
];

/** Images used for security or authentication. */
export const SECURITY_AUTH_IMAGES: StaticImageData[] = [
    IMAGES.SECURE_LOGIN,
    IMAGES.SECURITY_ON,
    IMAGES.SIGN_UP,
    IMAGES.TWO_FACTOR_AUTHENTICATION,
    IMAGES.UNLOCK,
    IMAGES.LOGIN,
];

/** Other images. */
export const OTHER_IMAGES: StaticImageData[] = [
    IMAGES.A_BETTER_WORLD,
    IMAGES.ATTACHED_FILE,
    IMAGES.BUG_FIXING,
    IMAGES.CANCEL,
    IMAGES.CO_WORKING,
    IMAGES.CONNECTED_WORLD,
    IMAGES.DISCOUNT,
    IMAGES.ENGINEERS,
    IMAGES.GOING_OFFLINE,
    IMAGES.INTERNET_ON_THE_GO,
    IMAGES.INTO_THE_NIGHT,
    IMAGES.LIGHT_THE_FIRE,
    IMAGES.LIGHTHOUSE,
    IMAGES.LOADING,
    IMAGES.RELAUNCH_DAY,
    IMAGES.SURVEILLANCE,
    IMAGES.TAKEN,
    IMAGES.VOID,
];

export const PAYMENT_SUCCESS_IMAGES: StaticImageData[] = [
    IMAGES.A_BETTER_WORLD,
    IMAGES.CONNECTED_WORLD,
    IMAGES.LIGHTHOUSE,
    IMAGES.RELAUNCH_DAY,
    IMAGES.STARRY_WINDOW,
    IMAGES.WELCOME,
];

export const PAYMENT_CANCEL_IMAGES: StaticImageData[] = [IMAGES.CANCEL, IMAGES.NO_DATA, IMAGES.VOID];

export const PAYMENT_ERROR_IMAGES: StaticImageData[] = [IMAGES.ALERT, IMAGES.SERVER_DOWN, IMAGES.WARNING];

export const PAYMENT_LOADING_IMAGES: StaticImageData[] = [IMAGES.LOADING, IMAGES.SEARCHING];

/** Images used for empty notification states. */
export const EMPTY_NOTIFICATIONS_IMAGES: StaticImageData[] = [
    IMAGES.ALERT,
    IMAGES.SURVEILLANCE,
    IMAGES.LIGHTHOUSE,
    IMAGES.STARRY_WINDOW,
];
