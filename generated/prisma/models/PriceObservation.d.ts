import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type PriceObservationModel = runtime.Types.Result.DefaultSelection<Prisma.$PriceObservationPayload>;
export type AggregatePriceObservation = {
    _count: PriceObservationCountAggregateOutputType | null;
    _avg: PriceObservationAvgAggregateOutputType | null;
    _sum: PriceObservationSumAggregateOutputType | null;
    _min: PriceObservationMinAggregateOutputType | null;
    _max: PriceObservationMaxAggregateOutputType | null;
};
export type PriceObservationAvgAggregateOutputType = {
    regularPrice: runtime.Decimal | null;
    salePrice: runtime.Decimal | null;
};
export type PriceObservationSumAggregateOutputType = {
    regularPrice: runtime.Decimal | null;
    salePrice: runtime.Decimal | null;
};
export type PriceObservationMinAggregateOutputType = {
    id: string | null;
    productId: string | null;
    storeId: string | null;
    sourceSystemId: string | null;
    ingestBatchId: string | null;
    regularPrice: runtime.Decimal | null;
    salePrice: runtime.Decimal | null;
    currency: string | null;
    observedAt: Date | null;
    validFrom: Date | null;
    validUntil: Date | null;
    sourceRecordId: string | null;
    createdAt: Date | null;
};
export type PriceObservationMaxAggregateOutputType = {
    id: string | null;
    productId: string | null;
    storeId: string | null;
    sourceSystemId: string | null;
    ingestBatchId: string | null;
    regularPrice: runtime.Decimal | null;
    salePrice: runtime.Decimal | null;
    currency: string | null;
    observedAt: Date | null;
    validFrom: Date | null;
    validUntil: Date | null;
    sourceRecordId: string | null;
    createdAt: Date | null;
};
export type PriceObservationCountAggregateOutputType = {
    id: number;
    productId: number;
    storeId: number;
    sourceSystemId: number;
    ingestBatchId: number;
    regularPrice: number;
    salePrice: number;
    currency: number;
    observedAt: number;
    validFrom: number;
    validUntil: number;
    sourceRecordId: number;
    createdAt: number;
    _all: number;
};
export type PriceObservationAvgAggregateInputType = {
    regularPrice?: true;
    salePrice?: true;
};
export type PriceObservationSumAggregateInputType = {
    regularPrice?: true;
    salePrice?: true;
};
export type PriceObservationMinAggregateInputType = {
    id?: true;
    productId?: true;
    storeId?: true;
    sourceSystemId?: true;
    ingestBatchId?: true;
    regularPrice?: true;
    salePrice?: true;
    currency?: true;
    observedAt?: true;
    validFrom?: true;
    validUntil?: true;
    sourceRecordId?: true;
    createdAt?: true;
};
export type PriceObservationMaxAggregateInputType = {
    id?: true;
    productId?: true;
    storeId?: true;
    sourceSystemId?: true;
    ingestBatchId?: true;
    regularPrice?: true;
    salePrice?: true;
    currency?: true;
    observedAt?: true;
    validFrom?: true;
    validUntil?: true;
    sourceRecordId?: true;
    createdAt?: true;
};
export type PriceObservationCountAggregateInputType = {
    id?: true;
    productId?: true;
    storeId?: true;
    sourceSystemId?: true;
    ingestBatchId?: true;
    regularPrice?: true;
    salePrice?: true;
    currency?: true;
    observedAt?: true;
    validFrom?: true;
    validUntil?: true;
    sourceRecordId?: true;
    createdAt?: true;
    _all?: true;
};
export type PriceObservationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithRelationInput | Prisma.PriceObservationOrderByWithRelationInput[];
    cursor?: Prisma.PriceObservationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | PriceObservationCountAggregateInputType;
    _avg?: PriceObservationAvgAggregateInputType;
    _sum?: PriceObservationSumAggregateInputType;
    _min?: PriceObservationMinAggregateInputType;
    _max?: PriceObservationMaxAggregateInputType;
};
export type GetPriceObservationAggregateType<T extends PriceObservationAggregateArgs> = {
    [P in keyof T & keyof AggregatePriceObservation]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregatePriceObservation[P]> : Prisma.GetScalarType<T[P], AggregatePriceObservation[P]>;
};
export type PriceObservationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithAggregationInput | Prisma.PriceObservationOrderByWithAggregationInput[];
    by: Prisma.PriceObservationScalarFieldEnum[] | Prisma.PriceObservationScalarFieldEnum;
    having?: Prisma.PriceObservationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PriceObservationCountAggregateInputType | true;
    _avg?: PriceObservationAvgAggregateInputType;
    _sum?: PriceObservationSumAggregateInputType;
    _min?: PriceObservationMinAggregateInputType;
    _max?: PriceObservationMaxAggregateInputType;
};
export type PriceObservationGroupByOutputType = {
    id: string;
    productId: string;
    storeId: string;
    sourceSystemId: string;
    ingestBatchId: string | null;
    regularPrice: runtime.Decimal | null;
    salePrice: runtime.Decimal | null;
    currency: string;
    observedAt: Date;
    validFrom: Date | null;
    validUntil: Date | null;
    sourceRecordId: string | null;
    createdAt: Date;
    _count: PriceObservationCountAggregateOutputType | null;
    _avg: PriceObservationAvgAggregateOutputType | null;
    _sum: PriceObservationSumAggregateOutputType | null;
    _min: PriceObservationMinAggregateOutputType | null;
    _max: PriceObservationMaxAggregateOutputType | null;
};
export type GetPriceObservationGroupByPayload<T extends PriceObservationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<PriceObservationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof PriceObservationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], PriceObservationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], PriceObservationGroupByOutputType[P]>;
}>>;
export type PriceObservationWhereInput = {
    AND?: Prisma.PriceObservationWhereInput | Prisma.PriceObservationWhereInput[];
    OR?: Prisma.PriceObservationWhereInput[];
    NOT?: Prisma.PriceObservationWhereInput | Prisma.PriceObservationWhereInput[];
    id?: Prisma.UuidFilter<"PriceObservation"> | string;
    productId?: Prisma.UuidFilter<"PriceObservation"> | string;
    storeId?: Prisma.UuidFilter<"PriceObservation"> | string;
    sourceSystemId?: Prisma.UuidFilter<"PriceObservation"> | string;
    ingestBatchId?: Prisma.UuidNullableFilter<"PriceObservation"> | string | null;
    regularPrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFilter<"PriceObservation"> | string;
    observedAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
    validFrom?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    validUntil?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    sourceRecordId?: Prisma.StringNullableFilter<"PriceObservation"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
    product?: Prisma.XOR<Prisma.ProductScalarRelationFilter, Prisma.ProductWhereInput>;
    store?: Prisma.XOR<Prisma.StoreScalarRelationFilter, Prisma.StoreWhereInput>;
    sourceSystem?: Prisma.XOR<Prisma.SourceSystemScalarRelationFilter, Prisma.SourceSystemWhereInput>;
    ingestBatch?: Prisma.XOR<Prisma.IngestBatchNullableScalarRelationFilter, Prisma.IngestBatchWhereInput> | null;
};
export type PriceObservationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    productId?: Prisma.SortOrder;
    storeId?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    ingestBatchId?: Prisma.SortOrderInput | Prisma.SortOrder;
    regularPrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    salePrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    observedAt?: Prisma.SortOrder;
    validFrom?: Prisma.SortOrderInput | Prisma.SortOrder;
    validUntil?: Prisma.SortOrderInput | Prisma.SortOrder;
    sourceRecordId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    product?: Prisma.ProductOrderByWithRelationInput;
    store?: Prisma.StoreOrderByWithRelationInput;
    sourceSystem?: Prisma.SourceSystemOrderByWithRelationInput;
    ingestBatch?: Prisma.IngestBatchOrderByWithRelationInput;
};
export type PriceObservationWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.PriceObservationWhereInput | Prisma.PriceObservationWhereInput[];
    OR?: Prisma.PriceObservationWhereInput[];
    NOT?: Prisma.PriceObservationWhereInput | Prisma.PriceObservationWhereInput[];
    productId?: Prisma.UuidFilter<"PriceObservation"> | string;
    storeId?: Prisma.UuidFilter<"PriceObservation"> | string;
    sourceSystemId?: Prisma.UuidFilter<"PriceObservation"> | string;
    ingestBatchId?: Prisma.UuidNullableFilter<"PriceObservation"> | string | null;
    regularPrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFilter<"PriceObservation"> | string;
    observedAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
    validFrom?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    validUntil?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    sourceRecordId?: Prisma.StringNullableFilter<"PriceObservation"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
    product?: Prisma.XOR<Prisma.ProductScalarRelationFilter, Prisma.ProductWhereInput>;
    store?: Prisma.XOR<Prisma.StoreScalarRelationFilter, Prisma.StoreWhereInput>;
    sourceSystem?: Prisma.XOR<Prisma.SourceSystemScalarRelationFilter, Prisma.SourceSystemWhereInput>;
    ingestBatch?: Prisma.XOR<Prisma.IngestBatchNullableScalarRelationFilter, Prisma.IngestBatchWhereInput> | null;
}, "id">;
export type PriceObservationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    productId?: Prisma.SortOrder;
    storeId?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    ingestBatchId?: Prisma.SortOrderInput | Prisma.SortOrder;
    regularPrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    salePrice?: Prisma.SortOrderInput | Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    observedAt?: Prisma.SortOrder;
    validFrom?: Prisma.SortOrderInput | Prisma.SortOrder;
    validUntil?: Prisma.SortOrderInput | Prisma.SortOrder;
    sourceRecordId?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.PriceObservationCountOrderByAggregateInput;
    _avg?: Prisma.PriceObservationAvgOrderByAggregateInput;
    _max?: Prisma.PriceObservationMaxOrderByAggregateInput;
    _min?: Prisma.PriceObservationMinOrderByAggregateInput;
    _sum?: Prisma.PriceObservationSumOrderByAggregateInput;
};
export type PriceObservationScalarWhereWithAggregatesInput = {
    AND?: Prisma.PriceObservationScalarWhereWithAggregatesInput | Prisma.PriceObservationScalarWhereWithAggregatesInput[];
    OR?: Prisma.PriceObservationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.PriceObservationScalarWhereWithAggregatesInput | Prisma.PriceObservationScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"PriceObservation"> | string;
    productId?: Prisma.UuidWithAggregatesFilter<"PriceObservation"> | string;
    storeId?: Prisma.UuidWithAggregatesFilter<"PriceObservation"> | string;
    sourceSystemId?: Prisma.UuidWithAggregatesFilter<"PriceObservation"> | string;
    ingestBatchId?: Prisma.UuidNullableWithAggregatesFilter<"PriceObservation"> | string | null;
    regularPrice?: Prisma.DecimalNullableWithAggregatesFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.DecimalNullableWithAggregatesFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringWithAggregatesFilter<"PriceObservation"> | string;
    observedAt?: Prisma.DateTimeWithAggregatesFilter<"PriceObservation"> | Date | string;
    validFrom?: Prisma.DateTimeNullableWithAggregatesFilter<"PriceObservation"> | Date | string | null;
    validUntil?: Prisma.DateTimeNullableWithAggregatesFilter<"PriceObservation"> | Date | string | null;
    sourceRecordId?: Prisma.StringNullableWithAggregatesFilter<"PriceObservation"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"PriceObservation"> | Date | string;
};
export type PriceObservationCreateInput = {
    id?: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
    product: Prisma.ProductCreateNestedOneWithoutPriceObservationsInput;
    store: Prisma.StoreCreateNestedOneWithoutPriceObservationsInput;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutPriceObservationsInput;
    ingestBatch?: Prisma.IngestBatchCreateNestedOneWithoutPriceObservationsInput;
};
export type PriceObservationUncheckedCreateInput = {
    id?: string;
    productId: string;
    storeId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    product?: Prisma.ProductUpdateOneRequiredWithoutPriceObservationsNestedInput;
    store?: Prisma.StoreUpdateOneRequiredWithoutPriceObservationsNestedInput;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutPriceObservationsNestedInput;
    ingestBatch?: Prisma.IngestBatchUpdateOneWithoutPriceObservationsNestedInput;
};
export type PriceObservationUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationCreateManyInput = {
    id?: string;
    productId: string;
    storeId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationListRelationFilter = {
    every?: Prisma.PriceObservationWhereInput;
    some?: Prisma.PriceObservationWhereInput;
    none?: Prisma.PriceObservationWhereInput;
};
export type PriceObservationOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type PriceObservationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    productId?: Prisma.SortOrder;
    storeId?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    ingestBatchId?: Prisma.SortOrder;
    regularPrice?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    observedAt?: Prisma.SortOrder;
    validFrom?: Prisma.SortOrder;
    validUntil?: Prisma.SortOrder;
    sourceRecordId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PriceObservationAvgOrderByAggregateInput = {
    regularPrice?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
};
export type PriceObservationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    productId?: Prisma.SortOrder;
    storeId?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    ingestBatchId?: Prisma.SortOrder;
    regularPrice?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    observedAt?: Prisma.SortOrder;
    validFrom?: Prisma.SortOrder;
    validUntil?: Prisma.SortOrder;
    sourceRecordId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PriceObservationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    productId?: Prisma.SortOrder;
    storeId?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    ingestBatchId?: Prisma.SortOrder;
    regularPrice?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
    currency?: Prisma.SortOrder;
    observedAt?: Prisma.SortOrder;
    validFrom?: Prisma.SortOrder;
    validUntil?: Prisma.SortOrder;
    sourceRecordId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type PriceObservationSumOrderByAggregateInput = {
    regularPrice?: Prisma.SortOrder;
    salePrice?: Prisma.SortOrder;
};
export type PriceObservationCreateNestedManyWithoutProductInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput> | Prisma.PriceObservationCreateWithoutProductInput[] | Prisma.PriceObservationUncheckedCreateWithoutProductInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutProductInput | Prisma.PriceObservationCreateOrConnectWithoutProductInput[];
    createMany?: Prisma.PriceObservationCreateManyProductInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUncheckedCreateNestedManyWithoutProductInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput> | Prisma.PriceObservationCreateWithoutProductInput[] | Prisma.PriceObservationUncheckedCreateWithoutProductInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutProductInput | Prisma.PriceObservationCreateOrConnectWithoutProductInput[];
    createMany?: Prisma.PriceObservationCreateManyProductInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUpdateManyWithoutProductNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput> | Prisma.PriceObservationCreateWithoutProductInput[] | Prisma.PriceObservationUncheckedCreateWithoutProductInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutProductInput | Prisma.PriceObservationCreateOrConnectWithoutProductInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutProductInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutProductInput[];
    createMany?: Prisma.PriceObservationCreateManyProductInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutProductInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutProductInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutProductInput | Prisma.PriceObservationUpdateManyWithWhereWithoutProductInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationUncheckedUpdateManyWithoutProductNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput> | Prisma.PriceObservationCreateWithoutProductInput[] | Prisma.PriceObservationUncheckedCreateWithoutProductInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutProductInput | Prisma.PriceObservationCreateOrConnectWithoutProductInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutProductInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutProductInput[];
    createMany?: Prisma.PriceObservationCreateManyProductInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutProductInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutProductInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutProductInput | Prisma.PriceObservationUpdateManyWithWhereWithoutProductInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationCreateNestedManyWithoutStoreInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput> | Prisma.PriceObservationCreateWithoutStoreInput[] | Prisma.PriceObservationUncheckedCreateWithoutStoreInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutStoreInput | Prisma.PriceObservationCreateOrConnectWithoutStoreInput[];
    createMany?: Prisma.PriceObservationCreateManyStoreInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUncheckedCreateNestedManyWithoutStoreInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput> | Prisma.PriceObservationCreateWithoutStoreInput[] | Prisma.PriceObservationUncheckedCreateWithoutStoreInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutStoreInput | Prisma.PriceObservationCreateOrConnectWithoutStoreInput[];
    createMany?: Prisma.PriceObservationCreateManyStoreInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUpdateManyWithoutStoreNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput> | Prisma.PriceObservationCreateWithoutStoreInput[] | Prisma.PriceObservationUncheckedCreateWithoutStoreInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutStoreInput | Prisma.PriceObservationCreateOrConnectWithoutStoreInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutStoreInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutStoreInput[];
    createMany?: Prisma.PriceObservationCreateManyStoreInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutStoreInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutStoreInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutStoreInput | Prisma.PriceObservationUpdateManyWithWhereWithoutStoreInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationUncheckedUpdateManyWithoutStoreNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput> | Prisma.PriceObservationCreateWithoutStoreInput[] | Prisma.PriceObservationUncheckedCreateWithoutStoreInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutStoreInput | Prisma.PriceObservationCreateOrConnectWithoutStoreInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutStoreInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutStoreInput[];
    createMany?: Prisma.PriceObservationCreateManyStoreInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutStoreInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutStoreInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutStoreInput | Prisma.PriceObservationUpdateManyWithWhereWithoutStoreInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationCreateNestedManyWithoutSourceSystemInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput> | Prisma.PriceObservationCreateWithoutSourceSystemInput[] | Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput | Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput[];
    createMany?: Prisma.PriceObservationCreateManySourceSystemInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUncheckedCreateNestedManyWithoutSourceSystemInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput> | Prisma.PriceObservationCreateWithoutSourceSystemInput[] | Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput | Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput[];
    createMany?: Prisma.PriceObservationCreateManySourceSystemInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUpdateManyWithoutSourceSystemNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput> | Prisma.PriceObservationCreateWithoutSourceSystemInput[] | Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput | Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutSourceSystemInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutSourceSystemInput[];
    createMany?: Prisma.PriceObservationCreateManySourceSystemInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutSourceSystemInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutSourceSystemInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutSourceSystemInput | Prisma.PriceObservationUpdateManyWithWhereWithoutSourceSystemInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationUncheckedUpdateManyWithoutSourceSystemNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput> | Prisma.PriceObservationCreateWithoutSourceSystemInput[] | Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput | Prisma.PriceObservationCreateOrConnectWithoutSourceSystemInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutSourceSystemInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutSourceSystemInput[];
    createMany?: Prisma.PriceObservationCreateManySourceSystemInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutSourceSystemInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutSourceSystemInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutSourceSystemInput | Prisma.PriceObservationUpdateManyWithWhereWithoutSourceSystemInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationCreateNestedManyWithoutIngestBatchInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput> | Prisma.PriceObservationCreateWithoutIngestBatchInput[] | Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput | Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput[];
    createMany?: Prisma.PriceObservationCreateManyIngestBatchInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUncheckedCreateNestedManyWithoutIngestBatchInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput> | Prisma.PriceObservationCreateWithoutIngestBatchInput[] | Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput | Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput[];
    createMany?: Prisma.PriceObservationCreateManyIngestBatchInputEnvelope;
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
};
export type PriceObservationUpdateManyWithoutIngestBatchNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput> | Prisma.PriceObservationCreateWithoutIngestBatchInput[] | Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput | Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutIngestBatchInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutIngestBatchInput[];
    createMany?: Prisma.PriceObservationCreateManyIngestBatchInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutIngestBatchInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutIngestBatchInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutIngestBatchInput | Prisma.PriceObservationUpdateManyWithWhereWithoutIngestBatchInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationUncheckedUpdateManyWithoutIngestBatchNestedInput = {
    create?: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput> | Prisma.PriceObservationCreateWithoutIngestBatchInput[] | Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput[];
    connectOrCreate?: Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput | Prisma.PriceObservationCreateOrConnectWithoutIngestBatchInput[];
    upsert?: Prisma.PriceObservationUpsertWithWhereUniqueWithoutIngestBatchInput | Prisma.PriceObservationUpsertWithWhereUniqueWithoutIngestBatchInput[];
    createMany?: Prisma.PriceObservationCreateManyIngestBatchInputEnvelope;
    set?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    disconnect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    delete?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    connect?: Prisma.PriceObservationWhereUniqueInput | Prisma.PriceObservationWhereUniqueInput[];
    update?: Prisma.PriceObservationUpdateWithWhereUniqueWithoutIngestBatchInput | Prisma.PriceObservationUpdateWithWhereUniqueWithoutIngestBatchInput[];
    updateMany?: Prisma.PriceObservationUpdateManyWithWhereWithoutIngestBatchInput | Prisma.PriceObservationUpdateManyWithWhereWithoutIngestBatchInput[];
    deleteMany?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
};
export type PriceObservationCreateWithoutProductInput = {
    id?: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
    store: Prisma.StoreCreateNestedOneWithoutPriceObservationsInput;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutPriceObservationsInput;
    ingestBatch?: Prisma.IngestBatchCreateNestedOneWithoutPriceObservationsInput;
};
export type PriceObservationUncheckedCreateWithoutProductInput = {
    id?: string;
    storeId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationCreateOrConnectWithoutProductInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput>;
};
export type PriceObservationCreateManyProductInputEnvelope = {
    data: Prisma.PriceObservationCreateManyProductInput | Prisma.PriceObservationCreateManyProductInput[];
    skipDuplicates?: boolean;
};
export type PriceObservationUpsertWithWhereUniqueWithoutProductInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    update: Prisma.XOR<Prisma.PriceObservationUpdateWithoutProductInput, Prisma.PriceObservationUncheckedUpdateWithoutProductInput>;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutProductInput, Prisma.PriceObservationUncheckedCreateWithoutProductInput>;
};
export type PriceObservationUpdateWithWhereUniqueWithoutProductInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateWithoutProductInput, Prisma.PriceObservationUncheckedUpdateWithoutProductInput>;
};
export type PriceObservationUpdateManyWithWhereWithoutProductInput = {
    where: Prisma.PriceObservationScalarWhereInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyWithoutProductInput>;
};
export type PriceObservationScalarWhereInput = {
    AND?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
    OR?: Prisma.PriceObservationScalarWhereInput[];
    NOT?: Prisma.PriceObservationScalarWhereInput | Prisma.PriceObservationScalarWhereInput[];
    id?: Prisma.UuidFilter<"PriceObservation"> | string;
    productId?: Prisma.UuidFilter<"PriceObservation"> | string;
    storeId?: Prisma.UuidFilter<"PriceObservation"> | string;
    sourceSystemId?: Prisma.UuidFilter<"PriceObservation"> | string;
    ingestBatchId?: Prisma.UuidNullableFilter<"PriceObservation"> | string | null;
    regularPrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.DecimalNullableFilter<"PriceObservation"> | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFilter<"PriceObservation"> | string;
    observedAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
    validFrom?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    validUntil?: Prisma.DateTimeNullableFilter<"PriceObservation"> | Date | string | null;
    sourceRecordId?: Prisma.StringNullableFilter<"PriceObservation"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"PriceObservation"> | Date | string;
};
export type PriceObservationCreateWithoutStoreInput = {
    id?: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
    product: Prisma.ProductCreateNestedOneWithoutPriceObservationsInput;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutPriceObservationsInput;
    ingestBatch?: Prisma.IngestBatchCreateNestedOneWithoutPriceObservationsInput;
};
export type PriceObservationUncheckedCreateWithoutStoreInput = {
    id?: string;
    productId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationCreateOrConnectWithoutStoreInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput>;
};
export type PriceObservationCreateManyStoreInputEnvelope = {
    data: Prisma.PriceObservationCreateManyStoreInput | Prisma.PriceObservationCreateManyStoreInput[];
    skipDuplicates?: boolean;
};
export type PriceObservationUpsertWithWhereUniqueWithoutStoreInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    update: Prisma.XOR<Prisma.PriceObservationUpdateWithoutStoreInput, Prisma.PriceObservationUncheckedUpdateWithoutStoreInput>;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutStoreInput, Prisma.PriceObservationUncheckedCreateWithoutStoreInput>;
};
export type PriceObservationUpdateWithWhereUniqueWithoutStoreInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateWithoutStoreInput, Prisma.PriceObservationUncheckedUpdateWithoutStoreInput>;
};
export type PriceObservationUpdateManyWithWhereWithoutStoreInput = {
    where: Prisma.PriceObservationScalarWhereInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyWithoutStoreInput>;
};
export type PriceObservationCreateWithoutSourceSystemInput = {
    id?: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
    product: Prisma.ProductCreateNestedOneWithoutPriceObservationsInput;
    store: Prisma.StoreCreateNestedOneWithoutPriceObservationsInput;
    ingestBatch?: Prisma.IngestBatchCreateNestedOneWithoutPriceObservationsInput;
};
export type PriceObservationUncheckedCreateWithoutSourceSystemInput = {
    id?: string;
    productId: string;
    storeId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationCreateOrConnectWithoutSourceSystemInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput>;
};
export type PriceObservationCreateManySourceSystemInputEnvelope = {
    data: Prisma.PriceObservationCreateManySourceSystemInput | Prisma.PriceObservationCreateManySourceSystemInput[];
    skipDuplicates?: boolean;
};
export type PriceObservationUpsertWithWhereUniqueWithoutSourceSystemInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    update: Prisma.XOR<Prisma.PriceObservationUpdateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedUpdateWithoutSourceSystemInput>;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedCreateWithoutSourceSystemInput>;
};
export type PriceObservationUpdateWithWhereUniqueWithoutSourceSystemInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateWithoutSourceSystemInput, Prisma.PriceObservationUncheckedUpdateWithoutSourceSystemInput>;
};
export type PriceObservationUpdateManyWithWhereWithoutSourceSystemInput = {
    where: Prisma.PriceObservationScalarWhereInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyWithoutSourceSystemInput>;
};
export type PriceObservationCreateWithoutIngestBatchInput = {
    id?: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
    product: Prisma.ProductCreateNestedOneWithoutPriceObservationsInput;
    store: Prisma.StoreCreateNestedOneWithoutPriceObservationsInput;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutPriceObservationsInput;
};
export type PriceObservationUncheckedCreateWithoutIngestBatchInput = {
    id?: string;
    productId: string;
    storeId: string;
    sourceSystemId: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationCreateOrConnectWithoutIngestBatchInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput>;
};
export type PriceObservationCreateManyIngestBatchInputEnvelope = {
    data: Prisma.PriceObservationCreateManyIngestBatchInput | Prisma.PriceObservationCreateManyIngestBatchInput[];
    skipDuplicates?: boolean;
};
export type PriceObservationUpsertWithWhereUniqueWithoutIngestBatchInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    update: Prisma.XOR<Prisma.PriceObservationUpdateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedUpdateWithoutIngestBatchInput>;
    create: Prisma.XOR<Prisma.PriceObservationCreateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedCreateWithoutIngestBatchInput>;
};
export type PriceObservationUpdateWithWhereUniqueWithoutIngestBatchInput = {
    where: Prisma.PriceObservationWhereUniqueInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateWithoutIngestBatchInput, Prisma.PriceObservationUncheckedUpdateWithoutIngestBatchInput>;
};
export type PriceObservationUpdateManyWithWhereWithoutIngestBatchInput = {
    where: Prisma.PriceObservationScalarWhereInput;
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyWithoutIngestBatchInput>;
};
export type PriceObservationCreateManyProductInput = {
    id?: string;
    storeId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateWithoutProductInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    store?: Prisma.StoreUpdateOneRequiredWithoutPriceObservationsNestedInput;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutPriceObservationsNestedInput;
    ingestBatch?: Prisma.IngestBatchUpdateOneWithoutPriceObservationsNestedInput;
};
export type PriceObservationUncheckedUpdateWithoutProductInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationUncheckedUpdateManyWithoutProductInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationCreateManyStoreInput = {
    id?: string;
    productId: string;
    sourceSystemId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateWithoutStoreInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    product?: Prisma.ProductUpdateOneRequiredWithoutPriceObservationsNestedInput;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutPriceObservationsNestedInput;
    ingestBatch?: Prisma.IngestBatchUpdateOneWithoutPriceObservationsNestedInput;
};
export type PriceObservationUncheckedUpdateWithoutStoreInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationUncheckedUpdateManyWithoutStoreInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationCreateManySourceSystemInput = {
    id?: string;
    productId: string;
    storeId: string;
    ingestBatchId?: string | null;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    product?: Prisma.ProductUpdateOneRequiredWithoutPriceObservationsNestedInput;
    store?: Prisma.StoreUpdateOneRequiredWithoutPriceObservationsNestedInput;
    ingestBatch?: Prisma.IngestBatchUpdateOneWithoutPriceObservationsNestedInput;
};
export type PriceObservationUncheckedUpdateWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationUncheckedUpdateManyWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    ingestBatchId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationCreateManyIngestBatchInput = {
    id?: string;
    productId: string;
    storeId: string;
    sourceSystemId: string;
    regularPrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: string;
    observedAt: Date | string;
    validFrom?: Date | string | null;
    validUntil?: Date | string | null;
    sourceRecordId?: string | null;
    createdAt?: Date | string;
};
export type PriceObservationUpdateWithoutIngestBatchInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    product?: Prisma.ProductUpdateOneRequiredWithoutPriceObservationsNestedInput;
    store?: Prisma.StoreUpdateOneRequiredWithoutPriceObservationsNestedInput;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutPriceObservationsNestedInput;
};
export type PriceObservationUncheckedUpdateWithoutIngestBatchInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationUncheckedUpdateManyWithoutIngestBatchInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    productId?: Prisma.StringFieldUpdateOperationsInput | string;
    storeId?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    regularPrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    salePrice?: Prisma.NullableDecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string | null;
    currency?: Prisma.StringFieldUpdateOperationsInput | string;
    observedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    validFrom?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    validUntil?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    sourceRecordId?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type PriceObservationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    productId?: boolean;
    storeId?: boolean;
    sourceSystemId?: boolean;
    ingestBatchId?: boolean;
    regularPrice?: boolean;
    salePrice?: boolean;
    currency?: boolean;
    observedAt?: boolean;
    validFrom?: boolean;
    validUntil?: boolean;
    sourceRecordId?: boolean;
    createdAt?: boolean;
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
}, ExtArgs["result"]["priceObservation"]>;
export type PriceObservationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    productId?: boolean;
    storeId?: boolean;
    sourceSystemId?: boolean;
    ingestBatchId?: boolean;
    regularPrice?: boolean;
    salePrice?: boolean;
    currency?: boolean;
    observedAt?: boolean;
    validFrom?: boolean;
    validUntil?: boolean;
    sourceRecordId?: boolean;
    createdAt?: boolean;
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
}, ExtArgs["result"]["priceObservation"]>;
export type PriceObservationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    productId?: boolean;
    storeId?: boolean;
    sourceSystemId?: boolean;
    ingestBatchId?: boolean;
    regularPrice?: boolean;
    salePrice?: boolean;
    currency?: boolean;
    observedAt?: boolean;
    validFrom?: boolean;
    validUntil?: boolean;
    sourceRecordId?: boolean;
    createdAt?: boolean;
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
}, ExtArgs["result"]["priceObservation"]>;
export type PriceObservationSelectScalar = {
    id?: boolean;
    productId?: boolean;
    storeId?: boolean;
    sourceSystemId?: boolean;
    ingestBatchId?: boolean;
    regularPrice?: boolean;
    salePrice?: boolean;
    currency?: boolean;
    observedAt?: boolean;
    validFrom?: boolean;
    validUntil?: boolean;
    sourceRecordId?: boolean;
    createdAt?: boolean;
};
export type PriceObservationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "productId" | "storeId" | "sourceSystemId" | "ingestBatchId" | "regularPrice" | "salePrice" | "currency" | "observedAt" | "validFrom" | "validUntil" | "sourceRecordId" | "createdAt", ExtArgs["result"]["priceObservation"]>;
export type PriceObservationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
};
export type PriceObservationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
};
export type PriceObservationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    product?: boolean | Prisma.ProductDefaultArgs<ExtArgs>;
    store?: boolean | Prisma.StoreDefaultArgs<ExtArgs>;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    ingestBatch?: boolean | Prisma.PriceObservation$ingestBatchArgs<ExtArgs>;
};
export type $PriceObservationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "PriceObservation";
    objects: {
        product: Prisma.$ProductPayload<ExtArgs>;
        store: Prisma.$StorePayload<ExtArgs>;
        sourceSystem: Prisma.$SourceSystemPayload<ExtArgs>;
        ingestBatch: Prisma.$IngestBatchPayload<ExtArgs> | null;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        productId: string;
        storeId: string;
        sourceSystemId: string;
        ingestBatchId: string | null;
        regularPrice: runtime.Decimal | null;
        salePrice: runtime.Decimal | null;
        currency: string;
        observedAt: Date;
        validFrom: Date | null;
        validUntil: Date | null;
        sourceRecordId: string | null;
        createdAt: Date;
    }, ExtArgs["result"]["priceObservation"]>;
    composites: {};
};
export type PriceObservationGetPayload<S extends boolean | null | undefined | PriceObservationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload, S>;
export type PriceObservationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<PriceObservationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: PriceObservationCountAggregateInputType | true;
};
export interface PriceObservationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['PriceObservation'];
        meta: {
            name: 'PriceObservation';
        };
    };
    findUnique<T extends PriceObservationFindUniqueArgs>(args: Prisma.SelectSubset<T, PriceObservationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends PriceObservationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, PriceObservationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends PriceObservationFindFirstArgs>(args?: Prisma.SelectSubset<T, PriceObservationFindFirstArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends PriceObservationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, PriceObservationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends PriceObservationFindManyArgs>(args?: Prisma.SelectSubset<T, PriceObservationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends PriceObservationCreateArgs>(args: Prisma.SelectSubset<T, PriceObservationCreateArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends PriceObservationCreateManyArgs>(args?: Prisma.SelectSubset<T, PriceObservationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends PriceObservationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, PriceObservationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends PriceObservationDeleteArgs>(args: Prisma.SelectSubset<T, PriceObservationDeleteArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends PriceObservationUpdateArgs>(args: Prisma.SelectSubset<T, PriceObservationUpdateArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends PriceObservationDeleteManyArgs>(args?: Prisma.SelectSubset<T, PriceObservationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends PriceObservationUpdateManyArgs>(args: Prisma.SelectSubset<T, PriceObservationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends PriceObservationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, PriceObservationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends PriceObservationUpsertArgs>(args: Prisma.SelectSubset<T, PriceObservationUpsertArgs<ExtArgs>>): Prisma.Prisma__PriceObservationClient<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends PriceObservationCountArgs>(args?: Prisma.Subset<T, PriceObservationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], PriceObservationCountAggregateOutputType> : number>;
    aggregate<T extends PriceObservationAggregateArgs>(args: Prisma.Subset<T, PriceObservationAggregateArgs>): Prisma.PrismaPromise<GetPriceObservationAggregateType<T>>;
    groupBy<T extends PriceObservationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: PriceObservationGroupByArgs['orderBy'];
    } : {
        orderBy?: PriceObservationGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, PriceObservationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPriceObservationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: PriceObservationFieldRefs;
}
export interface Prisma__PriceObservationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    product<T extends Prisma.ProductDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ProductDefaultArgs<ExtArgs>>): Prisma.Prisma__ProductClient<runtime.Types.Result.GetResult<Prisma.$ProductPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    store<T extends Prisma.StoreDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.StoreDefaultArgs<ExtArgs>>): Prisma.Prisma__StoreClient<runtime.Types.Result.GetResult<Prisma.$StorePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    sourceSystem<T extends Prisma.SourceSystemDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SourceSystemDefaultArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    ingestBatch<T extends Prisma.PriceObservation$ingestBatchArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.PriceObservation$ingestBatchArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface PriceObservationFieldRefs {
    readonly id: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly productId: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly storeId: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly sourceSystemId: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly ingestBatchId: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly regularPrice: Prisma.FieldRef<"PriceObservation", 'Decimal'>;
    readonly salePrice: Prisma.FieldRef<"PriceObservation", 'Decimal'>;
    readonly currency: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly observedAt: Prisma.FieldRef<"PriceObservation", 'DateTime'>;
    readonly validFrom: Prisma.FieldRef<"PriceObservation", 'DateTime'>;
    readonly validUntil: Prisma.FieldRef<"PriceObservation", 'DateTime'>;
    readonly sourceRecordId: Prisma.FieldRef<"PriceObservation", 'String'>;
    readonly createdAt: Prisma.FieldRef<"PriceObservation", 'DateTime'>;
}
export type PriceObservationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where: Prisma.PriceObservationWhereUniqueInput;
};
export type PriceObservationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where: Prisma.PriceObservationWhereUniqueInput;
};
export type PriceObservationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithRelationInput | Prisma.PriceObservationOrderByWithRelationInput[];
    cursor?: Prisma.PriceObservationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PriceObservationScalarFieldEnum | Prisma.PriceObservationScalarFieldEnum[];
};
export type PriceObservationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithRelationInput | Prisma.PriceObservationOrderByWithRelationInput[];
    cursor?: Prisma.PriceObservationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PriceObservationScalarFieldEnum | Prisma.PriceObservationScalarFieldEnum[];
};
export type PriceObservationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where?: Prisma.PriceObservationWhereInput;
    orderBy?: Prisma.PriceObservationOrderByWithRelationInput | Prisma.PriceObservationOrderByWithRelationInput[];
    cursor?: Prisma.PriceObservationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.PriceObservationScalarFieldEnum | Prisma.PriceObservationScalarFieldEnum[];
};
export type PriceObservationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PriceObservationCreateInput, Prisma.PriceObservationUncheckedCreateInput>;
};
export type PriceObservationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.PriceObservationCreateManyInput | Prisma.PriceObservationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type PriceObservationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    data: Prisma.PriceObservationCreateManyInput | Prisma.PriceObservationCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.PriceObservationIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type PriceObservationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PriceObservationUpdateInput, Prisma.PriceObservationUncheckedUpdateInput>;
    where: Prisma.PriceObservationWhereUniqueInput;
};
export type PriceObservationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyInput>;
    where?: Prisma.PriceObservationWhereInput;
    limit?: number;
};
export type PriceObservationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.PriceObservationUpdateManyMutationInput, Prisma.PriceObservationUncheckedUpdateManyInput>;
    where?: Prisma.PriceObservationWhereInput;
    limit?: number;
    include?: Prisma.PriceObservationIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type PriceObservationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where: Prisma.PriceObservationWhereUniqueInput;
    create: Prisma.XOR<Prisma.PriceObservationCreateInput, Prisma.PriceObservationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.PriceObservationUpdateInput, Prisma.PriceObservationUncheckedUpdateInput>;
};
export type PriceObservationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
    where: Prisma.PriceObservationWhereUniqueInput;
};
export type PriceObservationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
    limit?: number;
};
export type PriceObservation$ingestBatchArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where?: Prisma.IngestBatchWhereInput;
};
export type PriceObservationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.PriceObservationSelect<ExtArgs> | null;
    omit?: Prisma.PriceObservationOmit<ExtArgs> | null;
    include?: Prisma.PriceObservationInclude<ExtArgs> | null;
};
