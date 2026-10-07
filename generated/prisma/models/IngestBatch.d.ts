import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type IngestBatchModel = runtime.Types.Result.DefaultSelection<Prisma.$IngestBatchPayload>;
export type AggregateIngestBatch = {
    _count: IngestBatchCountAggregateOutputType | null;
    _avg: IngestBatchAvgAggregateOutputType | null;
    _sum: IngestBatchSumAggregateOutputType | null;
    _min: IngestBatchMinAggregateOutputType | null;
    _max: IngestBatchMaxAggregateOutputType | null;
};
export type IngestBatchAvgAggregateOutputType = {
    recordsRead: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsRejected: number | null;
};
export type IngestBatchSumAggregateOutputType = {
    recordsRead: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsRejected: number | null;
};
export type IngestBatchMinAggregateOutputType = {
    id: string | null;
    sourceSystemId: string | null;
    status: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    recordsRead: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsRejected: number | null;
    sourceReference: string | null;
    errorMessage: string | null;
};
export type IngestBatchMaxAggregateOutputType = {
    id: string | null;
    sourceSystemId: string | null;
    status: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    recordsRead: number | null;
    recordsInserted: number | null;
    recordsUpdated: number | null;
    recordsRejected: number | null;
    sourceReference: string | null;
    errorMessage: string | null;
};
export type IngestBatchCountAggregateOutputType = {
    id: number;
    sourceSystemId: number;
    status: number;
    startedAt: number;
    completedAt: number;
    recordsRead: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsRejected: number;
    sourceReference: number;
    errorMessage: number;
    _all: number;
};
export type IngestBatchAvgAggregateInputType = {
    recordsRead?: true;
    recordsInserted?: true;
    recordsUpdated?: true;
    recordsRejected?: true;
};
export type IngestBatchSumAggregateInputType = {
    recordsRead?: true;
    recordsInserted?: true;
    recordsUpdated?: true;
    recordsRejected?: true;
};
export type IngestBatchMinAggregateInputType = {
    id?: true;
    sourceSystemId?: true;
    status?: true;
    startedAt?: true;
    completedAt?: true;
    recordsRead?: true;
    recordsInserted?: true;
    recordsUpdated?: true;
    recordsRejected?: true;
    sourceReference?: true;
    errorMessage?: true;
};
export type IngestBatchMaxAggregateInputType = {
    id?: true;
    sourceSystemId?: true;
    status?: true;
    startedAt?: true;
    completedAt?: true;
    recordsRead?: true;
    recordsInserted?: true;
    recordsUpdated?: true;
    recordsRejected?: true;
    sourceReference?: true;
    errorMessage?: true;
};
export type IngestBatchCountAggregateInputType = {
    id?: true;
    sourceSystemId?: true;
    status?: true;
    startedAt?: true;
    completedAt?: true;
    recordsRead?: true;
    recordsInserted?: true;
    recordsUpdated?: true;
    recordsRejected?: true;
    sourceReference?: true;
    errorMessage?: true;
    _all?: true;
};
export type IngestBatchAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithRelationInput | Prisma.IngestBatchOrderByWithRelationInput[];
    cursor?: Prisma.IngestBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | IngestBatchCountAggregateInputType;
    _avg?: IngestBatchAvgAggregateInputType;
    _sum?: IngestBatchSumAggregateInputType;
    _min?: IngestBatchMinAggregateInputType;
    _max?: IngestBatchMaxAggregateInputType;
};
export type GetIngestBatchAggregateType<T extends IngestBatchAggregateArgs> = {
    [P in keyof T & keyof AggregateIngestBatch]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateIngestBatch[P]> : Prisma.GetScalarType<T[P], AggregateIngestBatch[P]>;
};
export type IngestBatchGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithAggregationInput | Prisma.IngestBatchOrderByWithAggregationInput[];
    by: Prisma.IngestBatchScalarFieldEnum[] | Prisma.IngestBatchScalarFieldEnum;
    having?: Prisma.IngestBatchScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: IngestBatchCountAggregateInputType | true;
    _avg?: IngestBatchAvgAggregateInputType;
    _sum?: IngestBatchSumAggregateInputType;
    _min?: IngestBatchMinAggregateInputType;
    _max?: IngestBatchMaxAggregateInputType;
};
export type IngestBatchGroupByOutputType = {
    id: string;
    sourceSystemId: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    recordsRead: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsRejected: number;
    sourceReference: string | null;
    errorMessage: string | null;
    _count: IngestBatchCountAggregateOutputType | null;
    _avg: IngestBatchAvgAggregateOutputType | null;
    _sum: IngestBatchSumAggregateOutputType | null;
    _min: IngestBatchMinAggregateOutputType | null;
    _max: IngestBatchMaxAggregateOutputType | null;
};
export type GetIngestBatchGroupByPayload<T extends IngestBatchGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<IngestBatchGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof IngestBatchGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], IngestBatchGroupByOutputType[P]> : Prisma.GetScalarType<T[P], IngestBatchGroupByOutputType[P]>;
}>>;
export type IngestBatchWhereInput = {
    AND?: Prisma.IngestBatchWhereInput | Prisma.IngestBatchWhereInput[];
    OR?: Prisma.IngestBatchWhereInput[];
    NOT?: Prisma.IngestBatchWhereInput | Prisma.IngestBatchWhereInput[];
    id?: Prisma.UuidFilter<"IngestBatch"> | string;
    sourceSystemId?: Prisma.UuidFilter<"IngestBatch"> | string;
    status?: Prisma.StringFilter<"IngestBatch"> | string;
    startedAt?: Prisma.DateTimeFilter<"IngestBatch"> | Date | string;
    completedAt?: Prisma.DateTimeNullableFilter<"IngestBatch"> | Date | string | null;
    recordsRead?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsInserted?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsUpdated?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsRejected?: Prisma.IntFilter<"IngestBatch"> | number;
    sourceReference?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
    errorMessage?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
    sourceSystem?: Prisma.XOR<Prisma.SourceSystemScalarRelationFilter, Prisma.SourceSystemWhereInput>;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
};
export type IngestBatchOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
    sourceReference?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    sourceSystem?: Prisma.SourceSystemOrderByWithRelationInput;
    priceObservations?: Prisma.PriceObservationOrderByRelationAggregateInput;
};
export type IngestBatchWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.IngestBatchWhereInput | Prisma.IngestBatchWhereInput[];
    OR?: Prisma.IngestBatchWhereInput[];
    NOT?: Prisma.IngestBatchWhereInput | Prisma.IngestBatchWhereInput[];
    sourceSystemId?: Prisma.UuidFilter<"IngestBatch"> | string;
    status?: Prisma.StringFilter<"IngestBatch"> | string;
    startedAt?: Prisma.DateTimeFilter<"IngestBatch"> | Date | string;
    completedAt?: Prisma.DateTimeNullableFilter<"IngestBatch"> | Date | string | null;
    recordsRead?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsInserted?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsUpdated?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsRejected?: Prisma.IntFilter<"IngestBatch"> | number;
    sourceReference?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
    errorMessage?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
    sourceSystem?: Prisma.XOR<Prisma.SourceSystemScalarRelationFilter, Prisma.SourceSystemWhereInput>;
    priceObservations?: Prisma.PriceObservationListRelationFilter;
}, "id">;
export type IngestBatchOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrderInput | Prisma.SortOrder;
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
    sourceReference?: Prisma.SortOrderInput | Prisma.SortOrder;
    errorMessage?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.IngestBatchCountOrderByAggregateInput;
    _avg?: Prisma.IngestBatchAvgOrderByAggregateInput;
    _max?: Prisma.IngestBatchMaxOrderByAggregateInput;
    _min?: Prisma.IngestBatchMinOrderByAggregateInput;
    _sum?: Prisma.IngestBatchSumOrderByAggregateInput;
};
export type IngestBatchScalarWhereWithAggregatesInput = {
    AND?: Prisma.IngestBatchScalarWhereWithAggregatesInput | Prisma.IngestBatchScalarWhereWithAggregatesInput[];
    OR?: Prisma.IngestBatchScalarWhereWithAggregatesInput[];
    NOT?: Prisma.IngestBatchScalarWhereWithAggregatesInput | Prisma.IngestBatchScalarWhereWithAggregatesInput[];
    id?: Prisma.UuidWithAggregatesFilter<"IngestBatch"> | string;
    sourceSystemId?: Prisma.UuidWithAggregatesFilter<"IngestBatch"> | string;
    status?: Prisma.StringWithAggregatesFilter<"IngestBatch"> | string;
    startedAt?: Prisma.DateTimeWithAggregatesFilter<"IngestBatch"> | Date | string;
    completedAt?: Prisma.DateTimeNullableWithAggregatesFilter<"IngestBatch"> | Date | string | null;
    recordsRead?: Prisma.IntWithAggregatesFilter<"IngestBatch"> | number;
    recordsInserted?: Prisma.IntWithAggregatesFilter<"IngestBatch"> | number;
    recordsUpdated?: Prisma.IntWithAggregatesFilter<"IngestBatch"> | number;
    recordsRejected?: Prisma.IntWithAggregatesFilter<"IngestBatch"> | number;
    sourceReference?: Prisma.StringNullableWithAggregatesFilter<"IngestBatch"> | string | null;
    errorMessage?: Prisma.StringNullableWithAggregatesFilter<"IngestBatch"> | string | null;
};
export type IngestBatchCreateInput = {
    id?: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutIngestBatchesInput;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutIngestBatchInput;
};
export type IngestBatchUncheckedCreateInput = {
    id?: string;
    sourceSystemId: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutIngestBatchInput;
};
export type IngestBatchUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutIngestBatchesNestedInput;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutIngestBatchNestedInput;
};
export type IngestBatchUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutIngestBatchNestedInput;
};
export type IngestBatchCreateManyInput = {
    id?: string;
    sourceSystemId: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
};
export type IngestBatchUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type IngestBatchUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type IngestBatchListRelationFilter = {
    every?: Prisma.IngestBatchWhereInput;
    some?: Prisma.IngestBatchWhereInput;
    none?: Prisma.IngestBatchWhereInput;
};
export type IngestBatchOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type IngestBatchCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
    sourceReference?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
};
export type IngestBatchAvgOrderByAggregateInput = {
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
};
export type IngestBatchMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
    sourceReference?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
};
export type IngestBatchMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    sourceSystemId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    startedAt?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
    sourceReference?: Prisma.SortOrder;
    errorMessage?: Prisma.SortOrder;
};
export type IngestBatchSumOrderByAggregateInput = {
    recordsRead?: Prisma.SortOrder;
    recordsInserted?: Prisma.SortOrder;
    recordsUpdated?: Prisma.SortOrder;
    recordsRejected?: Prisma.SortOrder;
};
export type IngestBatchNullableScalarRelationFilter = {
    is?: Prisma.IngestBatchWhereInput | null;
    isNot?: Prisma.IngestBatchWhereInput | null;
};
export type IngestBatchCreateNestedManyWithoutSourceSystemInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput> | Prisma.IngestBatchCreateWithoutSourceSystemInput[] | Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput | Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput[];
    createMany?: Prisma.IngestBatchCreateManySourceSystemInputEnvelope;
    connect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
};
export type IngestBatchUncheckedCreateNestedManyWithoutSourceSystemInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput> | Prisma.IngestBatchCreateWithoutSourceSystemInput[] | Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput | Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput[];
    createMany?: Prisma.IngestBatchCreateManySourceSystemInputEnvelope;
    connect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
};
export type IngestBatchUpdateManyWithoutSourceSystemNestedInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput> | Prisma.IngestBatchCreateWithoutSourceSystemInput[] | Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput | Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput[];
    upsert?: Prisma.IngestBatchUpsertWithWhereUniqueWithoutSourceSystemInput | Prisma.IngestBatchUpsertWithWhereUniqueWithoutSourceSystemInput[];
    createMany?: Prisma.IngestBatchCreateManySourceSystemInputEnvelope;
    set?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    disconnect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    delete?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    connect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    update?: Prisma.IngestBatchUpdateWithWhereUniqueWithoutSourceSystemInput | Prisma.IngestBatchUpdateWithWhereUniqueWithoutSourceSystemInput[];
    updateMany?: Prisma.IngestBatchUpdateManyWithWhereWithoutSourceSystemInput | Prisma.IngestBatchUpdateManyWithWhereWithoutSourceSystemInput[];
    deleteMany?: Prisma.IngestBatchScalarWhereInput | Prisma.IngestBatchScalarWhereInput[];
};
export type IngestBatchUncheckedUpdateManyWithoutSourceSystemNestedInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput> | Prisma.IngestBatchCreateWithoutSourceSystemInput[] | Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput[];
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput | Prisma.IngestBatchCreateOrConnectWithoutSourceSystemInput[];
    upsert?: Prisma.IngestBatchUpsertWithWhereUniqueWithoutSourceSystemInput | Prisma.IngestBatchUpsertWithWhereUniqueWithoutSourceSystemInput[];
    createMany?: Prisma.IngestBatchCreateManySourceSystemInputEnvelope;
    set?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    disconnect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    delete?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    connect?: Prisma.IngestBatchWhereUniqueInput | Prisma.IngestBatchWhereUniqueInput[];
    update?: Prisma.IngestBatchUpdateWithWhereUniqueWithoutSourceSystemInput | Prisma.IngestBatchUpdateWithWhereUniqueWithoutSourceSystemInput[];
    updateMany?: Prisma.IngestBatchUpdateManyWithWhereWithoutSourceSystemInput | Prisma.IngestBatchUpdateManyWithWhereWithoutSourceSystemInput[];
    deleteMany?: Prisma.IngestBatchScalarWhereInput | Prisma.IngestBatchScalarWhereInput[];
};
export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
};
export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
};
export type IngestBatchCreateNestedOneWithoutPriceObservationsInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutPriceObservationsInput;
    connect?: Prisma.IngestBatchWhereUniqueInput;
};
export type IngestBatchUpdateOneWithoutPriceObservationsNestedInput = {
    create?: Prisma.XOR<Prisma.IngestBatchCreateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedCreateWithoutPriceObservationsInput>;
    connectOrCreate?: Prisma.IngestBatchCreateOrConnectWithoutPriceObservationsInput;
    upsert?: Prisma.IngestBatchUpsertWithoutPriceObservationsInput;
    disconnect?: Prisma.IngestBatchWhereInput | boolean;
    delete?: Prisma.IngestBatchWhereInput | boolean;
    connect?: Prisma.IngestBatchWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.IngestBatchUpdateToOneWithWhereWithoutPriceObservationsInput, Prisma.IngestBatchUpdateWithoutPriceObservationsInput>, Prisma.IngestBatchUncheckedUpdateWithoutPriceObservationsInput>;
};
export type IngestBatchCreateWithoutSourceSystemInput = {
    id?: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
    priceObservations?: Prisma.PriceObservationCreateNestedManyWithoutIngestBatchInput;
};
export type IngestBatchUncheckedCreateWithoutSourceSystemInput = {
    id?: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
    priceObservations?: Prisma.PriceObservationUncheckedCreateNestedManyWithoutIngestBatchInput;
};
export type IngestBatchCreateOrConnectWithoutSourceSystemInput = {
    where: Prisma.IngestBatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput>;
};
export type IngestBatchCreateManySourceSystemInputEnvelope = {
    data: Prisma.IngestBatchCreateManySourceSystemInput | Prisma.IngestBatchCreateManySourceSystemInput[];
    skipDuplicates?: boolean;
};
export type IngestBatchUpsertWithWhereUniqueWithoutSourceSystemInput = {
    where: Prisma.IngestBatchWhereUniqueInput;
    update: Prisma.XOR<Prisma.IngestBatchUpdateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedUpdateWithoutSourceSystemInput>;
    create: Prisma.XOR<Prisma.IngestBatchCreateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedCreateWithoutSourceSystemInput>;
};
export type IngestBatchUpdateWithWhereUniqueWithoutSourceSystemInput = {
    where: Prisma.IngestBatchWhereUniqueInput;
    data: Prisma.XOR<Prisma.IngestBatchUpdateWithoutSourceSystemInput, Prisma.IngestBatchUncheckedUpdateWithoutSourceSystemInput>;
};
export type IngestBatchUpdateManyWithWhereWithoutSourceSystemInput = {
    where: Prisma.IngestBatchScalarWhereInput;
    data: Prisma.XOR<Prisma.IngestBatchUpdateManyMutationInput, Prisma.IngestBatchUncheckedUpdateManyWithoutSourceSystemInput>;
};
export type IngestBatchScalarWhereInput = {
    AND?: Prisma.IngestBatchScalarWhereInput | Prisma.IngestBatchScalarWhereInput[];
    OR?: Prisma.IngestBatchScalarWhereInput[];
    NOT?: Prisma.IngestBatchScalarWhereInput | Prisma.IngestBatchScalarWhereInput[];
    id?: Prisma.UuidFilter<"IngestBatch"> | string;
    sourceSystemId?: Prisma.UuidFilter<"IngestBatch"> | string;
    status?: Prisma.StringFilter<"IngestBatch"> | string;
    startedAt?: Prisma.DateTimeFilter<"IngestBatch"> | Date | string;
    completedAt?: Prisma.DateTimeNullableFilter<"IngestBatch"> | Date | string | null;
    recordsRead?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsInserted?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsUpdated?: Prisma.IntFilter<"IngestBatch"> | number;
    recordsRejected?: Prisma.IntFilter<"IngestBatch"> | number;
    sourceReference?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
    errorMessage?: Prisma.StringNullableFilter<"IngestBatch"> | string | null;
};
export type IngestBatchCreateWithoutPriceObservationsInput = {
    id?: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
    sourceSystem: Prisma.SourceSystemCreateNestedOneWithoutIngestBatchesInput;
};
export type IngestBatchUncheckedCreateWithoutPriceObservationsInput = {
    id?: string;
    sourceSystemId: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
};
export type IngestBatchCreateOrConnectWithoutPriceObservationsInput = {
    where: Prisma.IngestBatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.IngestBatchCreateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedCreateWithoutPriceObservationsInput>;
};
export type IngestBatchUpsertWithoutPriceObservationsInput = {
    update: Prisma.XOR<Prisma.IngestBatchUpdateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedUpdateWithoutPriceObservationsInput>;
    create: Prisma.XOR<Prisma.IngestBatchCreateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedCreateWithoutPriceObservationsInput>;
    where?: Prisma.IngestBatchWhereInput;
};
export type IngestBatchUpdateToOneWithWhereWithoutPriceObservationsInput = {
    where?: Prisma.IngestBatchWhereInput;
    data: Prisma.XOR<Prisma.IngestBatchUpdateWithoutPriceObservationsInput, Prisma.IngestBatchUncheckedUpdateWithoutPriceObservationsInput>;
};
export type IngestBatchUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sourceSystem?: Prisma.SourceSystemUpdateOneRequiredWithoutIngestBatchesNestedInput;
};
export type IngestBatchUncheckedUpdateWithoutPriceObservationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    sourceSystemId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type IngestBatchCreateManySourceSystemInput = {
    id?: string;
    status: string;
    startedAt?: Date | string;
    completedAt?: Date | string | null;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsRejected?: number;
    sourceReference?: string | null;
    errorMessage?: string | null;
};
export type IngestBatchUpdateWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priceObservations?: Prisma.PriceObservationUpdateManyWithoutIngestBatchNestedInput;
};
export type IngestBatchUncheckedUpdateWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    priceObservations?: Prisma.PriceObservationUncheckedUpdateManyWithoutIngestBatchNestedInput;
};
export type IngestBatchUncheckedUpdateManyWithoutSourceSystemInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    startedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: Prisma.NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    recordsRead?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsInserted?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsUpdated?: Prisma.IntFieldUpdateOperationsInput | number;
    recordsRejected?: Prisma.IntFieldUpdateOperationsInput | number;
    sourceReference?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    errorMessage?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type IngestBatchCountOutputType = {
    priceObservations: number;
};
export type IngestBatchCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    priceObservations?: boolean | IngestBatchCountOutputTypeCountPriceObservationsArgs;
};
export type IngestBatchCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchCountOutputTypeSelect<ExtArgs> | null;
};
export type IngestBatchCountOutputTypeCountPriceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.PriceObservationWhereInput;
};
export type IngestBatchSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sourceSystemId?: boolean;
    status?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    recordsRead?: boolean;
    recordsInserted?: boolean;
    recordsUpdated?: boolean;
    recordsRejected?: boolean;
    sourceReference?: boolean;
    errorMessage?: boolean;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    priceObservations?: boolean | Prisma.IngestBatch$priceObservationsArgs<ExtArgs>;
    _count?: boolean | Prisma.IngestBatchCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["ingestBatch"]>;
export type IngestBatchSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sourceSystemId?: boolean;
    status?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    recordsRead?: boolean;
    recordsInserted?: boolean;
    recordsUpdated?: boolean;
    recordsRejected?: boolean;
    sourceReference?: boolean;
    errorMessage?: boolean;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["ingestBatch"]>;
export type IngestBatchSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    sourceSystemId?: boolean;
    status?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    recordsRead?: boolean;
    recordsInserted?: boolean;
    recordsUpdated?: boolean;
    recordsRejected?: boolean;
    sourceReference?: boolean;
    errorMessage?: boolean;
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["ingestBatch"]>;
export type IngestBatchSelectScalar = {
    id?: boolean;
    sourceSystemId?: boolean;
    status?: boolean;
    startedAt?: boolean;
    completedAt?: boolean;
    recordsRead?: boolean;
    recordsInserted?: boolean;
    recordsUpdated?: boolean;
    recordsRejected?: boolean;
    sourceReference?: boolean;
    errorMessage?: boolean;
};
export type IngestBatchOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "sourceSystemId" | "status" | "startedAt" | "completedAt" | "recordsRead" | "recordsInserted" | "recordsUpdated" | "recordsRejected" | "sourceReference" | "errorMessage", ExtArgs["result"]["ingestBatch"]>;
export type IngestBatchInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
    priceObservations?: boolean | Prisma.IngestBatch$priceObservationsArgs<ExtArgs>;
    _count?: boolean | Prisma.IngestBatchCountOutputTypeDefaultArgs<ExtArgs>;
};
export type IngestBatchIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
};
export type IngestBatchIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    sourceSystem?: boolean | Prisma.SourceSystemDefaultArgs<ExtArgs>;
};
export type $IngestBatchPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "IngestBatch";
    objects: {
        sourceSystem: Prisma.$SourceSystemPayload<ExtArgs>;
        priceObservations: Prisma.$PriceObservationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        sourceSystemId: string;
        status: string;
        startedAt: Date;
        completedAt: Date | null;
        recordsRead: number;
        recordsInserted: number;
        recordsUpdated: number;
        recordsRejected: number;
        sourceReference: string | null;
        errorMessage: string | null;
    }, ExtArgs["result"]["ingestBatch"]>;
    composites: {};
};
export type IngestBatchGetPayload<S extends boolean | null | undefined | IngestBatchDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload, S>;
export type IngestBatchCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<IngestBatchFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: IngestBatchCountAggregateInputType | true;
};
export interface IngestBatchDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['IngestBatch'];
        meta: {
            name: 'IngestBatch';
        };
    };
    findUnique<T extends IngestBatchFindUniqueArgs>(args: Prisma.SelectSubset<T, IngestBatchFindUniqueArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends IngestBatchFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, IngestBatchFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends IngestBatchFindFirstArgs>(args?: Prisma.SelectSubset<T, IngestBatchFindFirstArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends IngestBatchFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, IngestBatchFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends IngestBatchFindManyArgs>(args?: Prisma.SelectSubset<T, IngestBatchFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends IngestBatchCreateArgs>(args: Prisma.SelectSubset<T, IngestBatchCreateArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends IngestBatchCreateManyArgs>(args?: Prisma.SelectSubset<T, IngestBatchCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends IngestBatchCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, IngestBatchCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends IngestBatchDeleteArgs>(args: Prisma.SelectSubset<T, IngestBatchDeleteArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends IngestBatchUpdateArgs>(args: Prisma.SelectSubset<T, IngestBatchUpdateArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends IngestBatchDeleteManyArgs>(args?: Prisma.SelectSubset<T, IngestBatchDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends IngestBatchUpdateManyArgs>(args: Prisma.SelectSubset<T, IngestBatchUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends IngestBatchUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, IngestBatchUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends IngestBatchUpsertArgs>(args: Prisma.SelectSubset<T, IngestBatchUpsertArgs<ExtArgs>>): Prisma.Prisma__IngestBatchClient<runtime.Types.Result.GetResult<Prisma.$IngestBatchPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends IngestBatchCountArgs>(args?: Prisma.Subset<T, IngestBatchCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], IngestBatchCountAggregateOutputType> : number>;
    aggregate<T extends IngestBatchAggregateArgs>(args: Prisma.Subset<T, IngestBatchAggregateArgs>): Prisma.PrismaPromise<GetIngestBatchAggregateType<T>>;
    groupBy<T extends IngestBatchGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: IngestBatchGroupByArgs['orderBy'];
    } : {
        orderBy?: IngestBatchGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, IngestBatchGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIngestBatchGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: IngestBatchFieldRefs;
}
export interface Prisma__IngestBatchClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    sourceSystem<T extends Prisma.SourceSystemDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.SourceSystemDefaultArgs<ExtArgs>>): Prisma.Prisma__SourceSystemClient<runtime.Types.Result.GetResult<Prisma.$SourceSystemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    priceObservations<T extends Prisma.IngestBatch$priceObservationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.IngestBatch$priceObservationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$PriceObservationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface IngestBatchFieldRefs {
    readonly id: Prisma.FieldRef<"IngestBatch", 'String'>;
    readonly sourceSystemId: Prisma.FieldRef<"IngestBatch", 'String'>;
    readonly status: Prisma.FieldRef<"IngestBatch", 'String'>;
    readonly startedAt: Prisma.FieldRef<"IngestBatch", 'DateTime'>;
    readonly completedAt: Prisma.FieldRef<"IngestBatch", 'DateTime'>;
    readonly recordsRead: Prisma.FieldRef<"IngestBatch", 'Int'>;
    readonly recordsInserted: Prisma.FieldRef<"IngestBatch", 'Int'>;
    readonly recordsUpdated: Prisma.FieldRef<"IngestBatch", 'Int'>;
    readonly recordsRejected: Prisma.FieldRef<"IngestBatch", 'Int'>;
    readonly sourceReference: Prisma.FieldRef<"IngestBatch", 'String'>;
    readonly errorMessage: Prisma.FieldRef<"IngestBatch", 'String'>;
}
export type IngestBatchFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where: Prisma.IngestBatchWhereUniqueInput;
};
export type IngestBatchFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where: Prisma.IngestBatchWhereUniqueInput;
};
export type IngestBatchFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithRelationInput | Prisma.IngestBatchOrderByWithRelationInput[];
    cursor?: Prisma.IngestBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IngestBatchScalarFieldEnum | Prisma.IngestBatchScalarFieldEnum[];
};
export type IngestBatchFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithRelationInput | Prisma.IngestBatchOrderByWithRelationInput[];
    cursor?: Prisma.IngestBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IngestBatchScalarFieldEnum | Prisma.IngestBatchScalarFieldEnum[];
};
export type IngestBatchFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where?: Prisma.IngestBatchWhereInput;
    orderBy?: Prisma.IngestBatchOrderByWithRelationInput | Prisma.IngestBatchOrderByWithRelationInput[];
    cursor?: Prisma.IngestBatchWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.IngestBatchScalarFieldEnum | Prisma.IngestBatchScalarFieldEnum[];
};
export type IngestBatchCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IngestBatchCreateInput, Prisma.IngestBatchUncheckedCreateInput>;
};
export type IngestBatchCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.IngestBatchCreateManyInput | Prisma.IngestBatchCreateManyInput[];
    skipDuplicates?: boolean;
};
export type IngestBatchCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    data: Prisma.IngestBatchCreateManyInput | Prisma.IngestBatchCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.IngestBatchIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type IngestBatchUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IngestBatchUpdateInput, Prisma.IngestBatchUncheckedUpdateInput>;
    where: Prisma.IngestBatchWhereUniqueInput;
};
export type IngestBatchUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.IngestBatchUpdateManyMutationInput, Prisma.IngestBatchUncheckedUpdateManyInput>;
    where?: Prisma.IngestBatchWhereInput;
    limit?: number;
};
export type IngestBatchUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.IngestBatchUpdateManyMutationInput, Prisma.IngestBatchUncheckedUpdateManyInput>;
    where?: Prisma.IngestBatchWhereInput;
    limit?: number;
    include?: Prisma.IngestBatchIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type IngestBatchUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where: Prisma.IngestBatchWhereUniqueInput;
    create: Prisma.XOR<Prisma.IngestBatchCreateInput, Prisma.IngestBatchUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.IngestBatchUpdateInput, Prisma.IngestBatchUncheckedUpdateInput>;
};
export type IngestBatchDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
    where: Prisma.IngestBatchWhereUniqueInput;
};
export type IngestBatchDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.IngestBatchWhereInput;
    limit?: number;
};
export type IngestBatch$priceObservationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type IngestBatchDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.IngestBatchSelect<ExtArgs> | null;
    omit?: Prisma.IngestBatchOmit<ExtArgs> | null;
    include?: Prisma.IngestBatchInclude<ExtArgs> | null;
};
