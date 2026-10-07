import * as runtime from "@prisma/client/runtime/client";
export const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export const PrismaClientValidationError = runtime.PrismaClientValidationError;
export const sql = runtime.sqltag;
export const empty = runtime.empty;
export const join = runtime.join;
export const raw = runtime.raw;
export const Sql = runtime.Sql;
export const Decimal = runtime.Decimal;
export const getExtensionContext = runtime.Extensions.getExtensionContext;
export const prismaVersion = {
    client: "7.10.0",
    engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
export const NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
export const DbNull = runtime.DbNull;
export const JsonNull = runtime.JsonNull;
export const AnyNull = runtime.AnyNull;
export const ModelName = {
    User: 'User',
    Role: 'Role',
    UserRole: 'UserRole',
    Product: 'Product',
    Retailer: 'Retailer',
    Store: 'Store',
    SourceSystem: 'SourceSystem',
    IngestBatch: 'IngestBatch',
    PriceObservation: 'PriceObservation'
};
export const TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
export const UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    firstName: 'firstName',
    lastName: 'lastName',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RoleScalarFieldEnum = {
    id: 'id',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt'
};
export const UserRoleScalarFieldEnum = {
    userId: 'userId',
    roleId: 'roleId',
    assignedAt: 'assignedAt'
};
export const ProductScalarFieldEnum = {
    id: 'id',
    barcode: 'barcode',
    productName: 'productName',
    brand: 'brand',
    quantityValue: 'quantityValue',
    quantityUnit: 'quantityUnit',
    quantityText: 'quantityText',
    categories: 'categories',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const RetailerScalarFieldEnum = {
    id: 'id',
    name: 'name',
    website: 'website',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const StoreScalarFieldEnum = {
    id: 'id',
    retailerId: 'retailerId',
    name: 'name',
    address: 'address',
    city: 'city',
    province: 'province',
    postalCode: 'postalCode',
    latitude: 'latitude',
    longitude: 'longitude',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const SourceSystemScalarFieldEnum = {
    id: 'id',
    name: 'name',
    sourceType: 'sourceType',
    baseUrl: 'baseUrl',
    licenseInfo: 'licenseInfo',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
export const IngestBatchScalarFieldEnum = {
    id: 'id',
    sourceSystemId: 'sourceSystemId',
    status: 'status',
    startedAt: 'startedAt',
    completedAt: 'completedAt',
    recordsRead: 'recordsRead',
    recordsInserted: 'recordsInserted',
    recordsUpdated: 'recordsUpdated',
    recordsRejected: 'recordsRejected',
    sourceReference: 'sourceReference',
    errorMessage: 'errorMessage'
};
export const PriceObservationScalarFieldEnum = {
    id: 'id',
    productId: 'productId',
    storeId: 'storeId',
    sourceSystemId: 'sourceSystemId',
    ingestBatchId: 'ingestBatchId',
    regularPrice: 'regularPrice',
    salePrice: 'salePrice',
    currency: 'currency',
    observedAt: 'observedAt',
    validFrom: 'validFrom',
    validUntil: 'validUntil',
    sourceRecordId: 'sourceRecordId',
    createdAt: 'createdAt'
};
export const SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
export const QueryMode = {
    default: 'default',
    insensitive: 'insensitive'
};
export const NullsOrder = {
    first: 'first',
    last: 'last'
};
export const defineExtension = runtime.Extensions.defineExtension;
//# sourceMappingURL=prismaNamespace.js.map