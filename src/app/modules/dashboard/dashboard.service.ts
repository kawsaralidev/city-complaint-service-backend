import { prisma } from "../../lib/prisma";

const getAdminDashboardOverview = async () => {
  // Get dashboard statistics
  const [
    totalUsers,
    totalCitizens,
    totalOfficers,
    totalAdmins,

    totalComplaints,
    pendingComplaints,
    assignedComplaints,
    inProgressComplaints,
    resolvedComplaints,
    closedComplaints,

    totalServiceRequests,
    pendingServiceRequests,
    approvedServiceRequests,
    paymentPendingServiceRequests,
    confirmedServiceRequests,
    assignedServiceRequests,
    inProgressServiceRequests,
    completedServiceRequests,

    totalPayments,
    paidPayments,
    pendingPayments,
    failedPayments,
    totalPaidAmount,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: "CITIZEN",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: "OFFICER",
        deletedAt: null,
      },
    }),

    prisma.user.count({
      where: {
        role: "ADMIN",
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        status: "PENDING",
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        status: "ASSIGNED",
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        status: "RESOLVED",
        deletedAt: null,
      },
    }),

    prisma.complaint.count({
      where: {
        status: "CLOSED",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "PENDING",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "APPROVED",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "PAYMENT_PENDING",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "CONFIRMED",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "ASSIGNED",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "IN_PROGRESS",
        deletedAt: null,
      },
    }),

    prisma.serviceRequest.count({
      where: {
        status: "COMPLETED",
        deletedAt: null,
      },
    }),

    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "PAID",
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.payment.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    users: {
      total: totalUsers,
      citizens: totalCitizens,
      officers: totalOfficers,
      admins: totalAdmins,
    },

    complaints: {
      total: totalComplaints,
      pending: pendingComplaints,
      assigned: assignedComplaints,
      inProgress: inProgressComplaints,
      resolved: resolvedComplaints,
      closed: closedComplaints,
    },

    serviceRequests: {
      total: totalServiceRequests,
      pending: pendingServiceRequests,
      approved: approvedServiceRequests,
      paymentPending: paymentPendingServiceRequests,
      confirmed: confirmedServiceRequests,
      assigned: assignedServiceRequests,
      inProgress: inProgressServiceRequests,
      completed: completedServiceRequests,
    },

    payments: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      failed: failedPayments,
      totalPaidAmount: totalPaidAmount._sum.amount?.toString() ?? "0",
    },
  };
};

// Get admin dashboard analytics
const getAdminDashboardAnalytics = async () => {
  // Get complaint statistics by status
  const complaintStatus = await prisma.complaint.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
    },
    _count: {
      id: true,
    },
  });

  // Get service request statistics by status
  const serviceRequestStatus = await prisma.serviceRequest.groupBy({
    by: ["status"],
    where: {
      deletedAt: null,
    },
    _count: {
      id: true,
    },
  });

  // Get monthly data for the last 12 months
  const now = new Date();

  const monthlyData = [];

  for (let i = 11; i >= 0; i--) {
    const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const [complaints, serviceRequests, payments] = await Promise.all([
      prisma.complaint.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.serviceRequest.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),

      prisma.payment.aggregate({
        where: {
          status: "PAID",
          paidAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    monthlyData.push({
      month: startDate.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),
      complaints,
      serviceRequests,
      paidAmount: payments._sum.amount?.toString() ?? "0",
    });
  }

  return {
    complaints: {
      byStatus: complaintStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    },

    serviceRequests: {
      byStatus: serviceRequestStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    },

    monthly: monthlyData,
  };
};

export const dashboardService = {
  getAdminDashboardOverview,
  getAdminDashboardAnalytics,
};
