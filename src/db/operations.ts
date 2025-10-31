import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PaginatedResponse } from '@/types';

/**
 * Create a document in Firestore
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const timestamp = new Date();
    await setDoc(docRef, {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    throw new Error(`Failed to create document: ${error}`);
  }
}

/**
 * Get a single document from Firestore
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  } catch (error) {
    throw new Error(`Failed to get document: ${error}`);
  }
}

/**
 * Update a document in Firestore
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  documentId: string,
  data: Partial<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (error) {
    throw new Error(`Failed to update document: ${error}`);
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(`Failed to delete document: ${error}`);
  }
}

/**
 * Query documents with filters, ordering, and pagination
 */
export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  filters?: Array<{
    field: string;
    operator: '==' | '<' | '<=' | '>' | '>=' | '!=';
    value: unknown;
  }>,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  pageNumber: number = 1,
  pageSize: number = 20
): Promise<PaginatedResponse<T>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any[] = [];

    // Add filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        constraints.push(where(filter.field, filter.operator, filter.value));
      }
    }

    // Add ordering
    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection || 'asc'));
    }

    // Get total count
    const countQuery = query(collection(db, collectionName), ...constraints.slice(0, filters?.length || 0));
    const countSnapshot = await getDocs(countQuery);
    const total = countSnapshot.size;

    // Add pagination using limit and startAt for offset simulation
    constraints.push(limit(pageSize * pageNumber));

    // Execute query
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    const pageOffset = (pageNumber - 1) * pageSize;
    const data = querySnapshot.docs
      .slice(pageOffset, pageOffset + pageSize)
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as unknown as T));

    return {
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    throw new Error(`Failed to query documents: ${error}`);
  }
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T extends DocumentData>(
  collectionName: string
): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as unknown as T));
  } catch (error) {
    throw new Error(`Failed to get all documents: ${error}`);
  }
}

/**
 * Batch write operations
 */
export async function batchWrite<T extends DocumentData>(
  operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: T;
  }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const timestamp = new Date();

    for (const op of operations) {
      const docRef = doc(db, op.collection, op.docId);

      if (op.type === 'set') {
        batch.set(docRef, {
          ...op.data,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      } else if (op.type === 'update') {
        batch.update(docRef, {
          ...op.data,
          updatedAt: timestamp,
        });
      } else if (op.type === 'delete') {
        batch.delete(docRef);
      }
    }

    await batch.commit();
  } catch (error) {
    throw new Error(`Failed to batch write: ${error}`);
  }
}

/**
 * Check if document exists
 */
export async function documentExists(
  collectionName: string,
  documentId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    throw new Error(`Failed to check document existence: ${error}`);
  }
}

/**
 * Count documents matching criteria
 */
export async function countDocuments(
  collectionName: string,
  filters?: Array<{
    field: string;
    operator: '==' | '<' | '<=' | '>' | '>=' | '!=';
    value: unknown;
  }>
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any[] = [];

    if (filters && filters.length > 0) {
      for (const filter of filters) {
        constraints.push(where(filter.field, filter.operator, filter.value));
      }
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    throw new Error(`Failed to count documents: ${error}`);
  }
}
