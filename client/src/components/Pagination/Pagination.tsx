import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Pagination.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Debug: sempre mostrar informações mesmo com 1 página para verificar se está funcionando
  console.log('Pagination render - currentPage:', currentPage, 'totalPages:', totalPages, 'totalItems:', totalItems);

  if (totalPages <= 1) {
    // Mostrar mensagem mesmo com 1 página para debug
    return (
      <div className="pagination-container">
        <div className="pagination-info">
          Mostrando todos os {totalItems} registros
        </div>
      </div>
    );
  }

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </div>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          title="Página anterior"
        >
          <FaChevronLeft />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageClick(page as number)}
            >
              {page}
            </button>
          );
        })}

        <button
          className="pagination-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          title="Próxima página"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

